import { uniq } from 'lodash'

import {
  DEFAULT_TENANT_ID,
  Error400,
  RawQueryParser,
  generateUUIDv1,
  getProperDisplayName,
  groupBy,
} from '@crowd/common'
import { formatSql, getDbInstance, prepareForModification } from '@crowd/database'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  ALL_PLATFORM_TYPES,
  MemberAttributeType,
  MemberIdentityType,
  PageData,
  SegmentType,
} from '@crowd/types'

import { findManyLfxMemberships } from '../lfx_memberships'
import { findMaintainerRoles } from '../maintainers'
import {
  IDbMemberCreateData,
  IDbMemberUpdateData,
} from '../old/apps/data_sink_worker/repo/member.data'
import { OrganizationField, queryOrgs } from '../organizations'
import { QueryExecutor } from '../queryExecutor'
import { fetchManySegments, findSegmentById } from '../segments'
import { QueryOptions, QueryResult, queryTable, queryTableById } from '../utils'

import { getMemberAttributeSettings } from './attributeSettings'
import { IDbMemberAttributeSetting, IDbMemberData } from './types'

import { fetchManyMemberIdentities, fetchManyMemberOrgs, fetchManyMemberSegments } from '.'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceChildLogger('db/members')

export enum MemberField {
  // meta
  ID = 'id',
  ATTRIBUTES = 'attributes',
  DISPLAY_NAME = 'displayName',
  SCORE = 'score',
  JOINED_AT = 'joinedAt',
  IMPORT_HASH = 'importHash',
  REACH = 'reach',
  CONTRIBUTIONS = 'contributions',

  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',

  TENANT_ID = 'tenantId',
  CREATED_BY_ID = 'createdById',
  UPDATED_BY_ID = 'updatedById',

  MANUALLY_CREATED = 'manuallyCreated',
  MANUALLY_CHANGED_FIELDS = 'manuallyChangedFields',
}

export const MEMBER_MERGE_FIELDS = [
  'id',
  'tags',
  'reach',
  'tasks',
  'joinedAt',
  'tenantId',
  'attributes',
  'displayName',
  'affiliations',
  'contributions',
  'manuallyCreated',
  'manuallyChangedFields',
]

export const MEMBER_UPDATE_COLUMNS = [
  MemberField.DISPLAY_NAME,
  MemberField.ATTRIBUTES,
  MemberField.CONTRIBUTIONS,
  MemberField.SCORE,
  MemberField.REACH,
  MemberField.IMPORT_HASH,
]

export const MEMBER_SELECT_COLUMNS = [
  'id',
  'score',
  'joinedAt',
  'reach',
  'attributes',
  'displayName',
  'manuallyChangedFields',
]

export const MEMBER_INSERT_COLUMNS = [
  'id',
  'attributes',
  'displayName',
  'joinedAt',
  'tenantId',
  'reach',
  'createdAt',
  'updatedAt',
]

const QUERY_FILTER_COLUMN_MAP: Map<string, { name: string; queryable?: boolean }> = new Map([
  ['activityCount', { name: 'coalesce(msa."activityCount", 0)::integer' }],
  ['attributes', { name: 'm.attributes' }],
  ['averageSentiment', { name: 'coalesce(msa."averageSentiment", 0)::decimal' }],
  ['displayName', { name: 'm."displayName"' }],
  ['id', { name: 'm.id' }],
  ['identityPlatforms', { name: 'coalesce(msa."activeOn", \'{}\'::text[])' }],
  ['isBot', { name: `COALESCE((m.attributes -> 'isBot' ->> 'default')::BOOLEAN, FALSE)` }],
  [
    'isOrganization',
    { name: `COALESCE((m.attributes -> 'isOrganization' ->> 'default')::BOOLEAN, FALSE)` },
  ],
  ['joinedAt', { name: 'm."joinedAt"' }],
  ['lastEnrichedAt', { name: 'me."lastUpdatedAt"' }],
  ['organizations', { name: 'mo."organizationId"', queryable: false }],
  ['score', { name: 'm.score' }],
  ['segmentId', { name: 'msa."segmentId"' }],
])

const QUERY_FILTER_ATTRIBUTE_MAP = ['avatarUrl', 'isBot', 'isTeamMember', 'jobTitle']

export async function queryMembersAdvanced(
  qx: QueryExecutor,
  redis: RedisClient,
  {
    filter = {} as any,
    search = null,
    limit = 20,
    offset = 0,
    orderBy = 'joinedAt_DESC',
    segmentId = undefined,
    countOnly = false,
    fields = [...QUERY_FILTER_COLUMN_MAP.keys()],
    include = {
      identities: true,
      segments: false,
      lfxMemberships: false,
      memberOrganizations: false,
      onlySubProjects: false,
      maintainers: true,
    } as {
      identities?: boolean
      segments?: boolean
      lfxMemberships?: boolean
      memberOrganizations?: boolean
      onlySubProjects?: boolean
      maintainers?: boolean
    },
    attributeSettings = [] as IDbMemberAttributeSetting[],
  },
): Promise<PageData<IDbMemberData>> {
  if (!attributeSettings || attributeSettings.length === 0) {
    attributeSettings = await getMemberAttributeSettings(qx, redis)
  }

  const withAggregates = !!segmentId
  let segment
  if (withAggregates) {
    segment = (await findSegmentById(qx, segmentId)) as any

    if (segment === null) {
      log.info('No segment found for member query. Returning empty result.')
      return {
        rows: [],
        count: 0,
        limit,
        offset,
      }
    }

    segmentId = segment.id
  }

  const params = {
    limit,
    offset,
    segmentId,
  }

  const filterString = RawQueryParser.parseFilters(
    filter,
    new Map([...QUERY_FILTER_COLUMN_MAP.entries()].map(([key, { name }]) => [key, name])),
    [
      {
        property: 'attributes',
        column: 'm.attributes',
        attributeInfos: [
          ...attributeSettings,
          {
            name: 'jobTitle',
            type: MemberAttributeType.STRING,
          },
        ],
      },
      {
        property: 'username',
        column: 'aggs.username',
        attributeInfos: ALL_PLATFORM_TYPES.map((p) => ({
          name: p,
          type: MemberAttributeType.STRING,
        })),
      },
    ],
    params,
    { pgPromiseFormat: true },
  )

  const effectiveOrderBy = typeof orderBy === 'string' && orderBy.length ? orderBy : 'joinedAt_DESC'

  const order = (function prepareOrderBy(
    orderBy = withAggregates ? 'activityCount_DESC' : 'id_DESC',
  ) {
    const orderSplit = orderBy.split('_')

    const orderField = QUERY_FILTER_COLUMN_MAP.get(orderSplit[0])?.name
    if (!orderField) {
      return withAggregates ? 'msa."activityCount" DESC' : 'm.id DESC'
    }
    const orderDirection = ['DESC', 'ASC'].includes(orderSplit[1]) ? orderSplit[1] : 'DESC'

    return `${orderField} ${orderDirection}`
  })(effectiveOrderBy)

  const withSearch = !!search
  let searchCTE = ''
  let searchJoin = ''

  if (withSearch) {
    search = search.toLowerCase()
    searchCTE = `
      ,
      member_search AS (
          SELECT
            "memberId"
          FROM "memberIdentities" mi
          join members m on m.id = mi."memberId"
          where (verified and type = '${MemberIdentityType.EMAIL}' and lower("value") ilike '%${search}%') or m."displayName" ilike '%${search}%'
          GROUP BY 1
        )
      `
    searchJoin = ` JOIN member_search ms ON ms."memberId" = m.id `
  }

  const createQuery = (fields) => `
      WITH member_orgs AS (
        SELECT
          "memberId",
          ARRAY_AGG("organizationId")::TEXT[] AS "organizationId"
        FROM "memberOrganizations"
        WHERE "deletedAt" IS NULL
        GROUP BY 1
      )
      ${searchCTE}
      SELECT
        ${fields}
      FROM members m
      ${
        withAggregates
          ? ` INNER JOIN "memberSegmentsAgg" msa ON msa."memberId" = m.id AND msa."segmentId" = $(segmentId)`
          : ''
      }
      LEFT JOIN member_orgs mo ON mo."memberId" = m.id
      LEFT JOIN "memberEnrichments" me ON me."memberId" = m.id
      ${searchJoin}
      WHERE (${filterString})
    `

  const countQuery = createQuery('COUNT(*)')

  if (countOnly) {
    return {
      rows: [],
      count: parseInt((await qx.selectOne(countQuery, params)).count, 10),
      limit,
      offset,
    }
  }

  const query = `
          ${createQuery(
            (function prepareFields(fields) {
              return `${fields
                .map((f) => {
                  const mappedField = QUERY_FILTER_COLUMN_MAP.get(f)
                  if (!mappedField) {
                    throw new Error400('en', `Invalid field: ${f}`)
                  }

                  return {
                    alias: f,
                    ...mappedField,
                  }
                })
                .filter((mappedField) => mappedField.queryable !== false)
                .filter((mappedField) => {
                  if (!withAggregates && mappedField.name.includes('msa.')) {
                    return false
                  }
                  if (!include.memberOrganizations && mappedField.name.includes('mo.')) {
                    return false
                  }
                  return true
                })
                .map((mappedField) => `${mappedField.name} AS "${mappedField.alias}"`)
                .join(',\n')}`
            })(fields),
          )}
          ORDER BY ${order} NULLS LAST
          LIMIT $(limit)
          OFFSET $(offset)
        `

  const results = await Promise.all([qx.select(query, params), qx.selectOne(countQuery, params)])

  const rows = results[0]

  rows.forEach((row) => {
    if (row.attributes && typeof row.attributes === 'object') {
      const filteredAttributes = {}
      QUERY_FILTER_ATTRIBUTE_MAP.forEach((attr) => {
        if (row.attributes[attr] !== undefined) {
          filteredAttributes[attr] = row.attributes[attr]
        }
      })
      row.attributes = filteredAttributes
    }
  })

  const count = parseInt(results[1].count, 10)

  const memberIds = rows.map((org) => org.id)
  if (memberIds.length === 0) {
    return { rows: [], count, limit, offset }
  }

  if (include.memberOrganizations) {
    const memberOrganizations = await fetchManyMemberOrgs(qx, memberIds)

    const orgIds = uniq(
      memberOrganizations.reduce((acc, mo) => {
        acc.push(...mo.organizations.map((o) => o.organizationId))
        return acc
      }, []),
    )

    const orgExtra = orgIds.length
      ? await queryOrgs(qx, {
          filter: {
            [OrganizationField.ID]: {
              in: orgIds,
            },
          },
          fields: [
            OrganizationField.ID,
            OrganizationField.DISPLAY_NAME,
            OrganizationField.LOGO,
            OrganizationField.CREATED_AT,
          ],
        })
      : []

    const lfxMemberships = orgIds.length
      ? await findManyLfxMemberships(qx, { organizationIds: orgIds })
      : []

    for (const member of rows) {
      member.organizations = []

      const memberOrgs =
        memberOrganizations.find((o) => o.memberId === member.id)?.organizations || []

      // Filter only organizations with null dateEnd (active organizations)
      const activeOrgs = memberOrgs.filter((org) => !org.dateEnd)

      // Apply the same sorting logic as in the list function
      const sortedActiveOrgs = activeOrgs.sort((a, b) => {
        if (!a || !b) {
          return 0
        }

        // First priority: isPrimaryWorkExperience
        const aPrimary = a.affiliationOverride?.isPrimaryWorkExperience === true
        const bPrimary = b.affiliationOverride?.isPrimaryWorkExperience === true

        if (aPrimary && !bPrimary) {
          return -1
        }
        if (!aPrimary && bPrimary) {
          return 1
        }

        // Second priority: has dateStart (only for non-primary organizations)
        const aHasDate = !!a.dateStart
        const bHasDate = !!b.dateStart

        if (aHasDate && !bHasDate) {
          return -1
        }
        if (!aHasDate && bHasDate) {
          return 1
        }

        // Third priority: if both have same dateStart status, sort by createdAt and alphabetically
        if (!a.dateStart && !b.dateStart) {
          // Get createdAt from organization data
          const aOrgInfo = orgExtra.find((odn) => odn.id === a.organizationId)
          const bOrgInfo = orgExtra.find((odn) => odn.id === b.organizationId)

          const aCreatedAt = aOrgInfo?.createdAt ? new Date(aOrgInfo.createdAt).getTime() : 0
          const bCreatedAt = bOrgInfo?.createdAt ? new Date(bOrgInfo.createdAt).getTime() : 0

          if (aCreatedAt !== bCreatedAt) {
            return bCreatedAt - aCreatedAt // Newest createdAt first
          }

          // If createdAt is also the same, sort alphabetically by organization displayName
          const aName = (aOrgInfo?.displayName || '').toLowerCase()
          const bName = (bOrgInfo?.displayName || '').toLowerCase()
          return aName.localeCompare(bName)
        }

        return 0
      })

      const activeOrg = sortedActiveOrgs[0] || null

      if (activeOrg) {
        const orgInfo = orgExtra.find((odn) => odn.id === activeOrg.organizationId)

        if (orgInfo) {
          const lfxMembership = lfxMemberships.find(
            (m) => m.organizationId === activeOrg.organizationId,
          )

          member.organizations = [
            {
              id: activeOrg.organizationId,
              displayName: orgInfo?.displayName || '',
              logo: orgInfo?.logo || '',
              lfxMembership: !!lfxMembership,
            },
          ]
        }
      }
    }
  }

  if (include.identities) {
    const identities = await fetchManyMemberIdentities(qx, memberIds)

    rows.forEach((member) => {
      const memberIdentities = identities.find((i) => i.memberId === member.id)?.identities || []

      // Simplify the identities structure to include only necessary fields
      member.identities = memberIdentities.map((identity) => ({
        type: identity.type,
        value: identity.value,
        platform: identity.platform,
        verified: identity.verified,
      }))
    })
  }

  if (include.segments) {
    const memberSegments = await fetchManyMemberSegments(qx, memberIds)
    const segmentIds = uniq(
      memberSegments.reduce((acc, ms) => {
        acc.push(...ms.segments.map((s) => s.segmentId))
        return acc
      }, []),
    )
    const segmentsInfo = await fetchManySegments(qx, segmentIds)

    rows.forEach((member) => {
      member.segments = (memberSegments.find((i) => i.memberId === member.id)?.segments || [])
        .map((segment) => {
          const segmentInfo = segmentsInfo.find((s) => s.id === segment.segmentId)

          // include only subprojects if flag is set
          if (include.onlySubProjects && segmentInfo?.type !== SegmentType.SUB_PROJECT) {
            return null
          }

          return {
            id: segment.segmentId,
            name: segmentInfo?.name,
            activityCount: segment.activityCount,
          }
        })
        .filter(Boolean)
    })
  }

  if (include.maintainers) {
    const maintainerRoles = await findMaintainerRoles(qx, memberIds)
    const segmentIds = uniq(maintainerRoles.map((m) => m.segmentId))
    const segmentsInfo = await fetchManySegments(qx, segmentIds)

    const groupedMaintainers = groupBy(maintainerRoles, (m) => m.memberId)
    rows.forEach((member) => {
      member.maintainerRoles = (groupedMaintainers.get(member.id) || []).map((role) => {
        const segmentInfo = segmentsInfo.find((s) => s.id === role.segmentId)
        return {
          ...role,
          segmentName: segmentInfo?.name,
        }
      })
    })
  }

  return { rows, count, limit, offset }
}

export async function queryMembers<T extends MemberField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'members', Object.values(MemberField), opts)
}

export async function findMemberById<T extends MemberField>(
  qx: QueryExecutor,
  memberId: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'members', Object.values(MemberField), memberId, fields)
}

export async function moveAffiliationsBetweenMembers(
  qx: QueryExecutor,
  fromMemberId: string,
  toMemberId: string,
): Promise<void> {
  const params: any = {
    fromMemberId,
    toMemberId,
  }

  await qx.result(
    `update "memberSegmentAffiliations" set "memberId" = $(toMemberId) where "memberId" = $(fromMemberId);`,
    params,
  )
}

export async function updateMember(
  qx: QueryExecutor,
  id: string,
  data: IDbMemberUpdateData,
): Promise<void> {
  // we shouldn't update id
  if ('id' in data) {
    delete data.id
  }

  const keys = Object.keys(data)
  if (keys.length === 0) {
    return
  }

  if (data.displayName) {
    data.displayName = getProperDisplayName(data.displayName)
  }

  const dbInstance = getDbInstance()

  keys.push('updatedAt')
  // construct custom column set
  const dynamicColumnSet = new dbInstance.helpers.ColumnSet(keys, {
    table: {
      table: 'members',
    },
  })

  const updatedAt = new Date()

  const prepared = prepareForModification(
    {
      ...data,
      updatedAt,
    },
    dynamicColumnSet,
  )
  const query = dbInstance.helpers.update(prepared, dynamicColumnSet)

  const condition = formatSql('where id = $(id) and "updatedAt" < $(updatedAt)', {
    id,
    updatedAt,
  })
  await qx.result(`${query} ${condition}`)
}

export async function createMember(qx: QueryExecutor, data: IDbMemberCreateData): Promise<string> {
  const id = generateUUIDv1()
  const ts = new Date()
  const dbInstance = getDbInstance()
  const columnSet = new dbInstance.helpers.ColumnSet(MEMBER_INSERT_COLUMNS, {
    table: {
      table: 'members',
    },
  })
  const prepared = prepareForModification(
    {
      ...data,
      id,
      tenantId: DEFAULT_TENANT_ID,
      createdAt: ts,
      updatedAt: ts,
    },
    columnSet,
  )

  const query = dbInstance.helpers.insert(prepared, columnSet)
  await qx.select(query)
  return id
}
