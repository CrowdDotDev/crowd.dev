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
import { RedisClient } from '@crowd/redis'
import { ALL_PLATFORM_TYPES, MemberAttributeType, PageData, SegmentType } from '@crowd/types'

import { findMaintainerRoles } from '../maintainers'
import {
  IDbMemberCreateData,
  IDbMemberUpdateData,
} from '../old/apps/data_sink_worker/repo/member.data'
import { QueryExecutor } from '../queryExecutor'
import { fetchManySegments } from '../segments'
import { QueryOptions, QueryResult, queryTable, queryTableById } from '../utils'

import { getMemberAttributeSettings } from './attributeSettings'
import { fetchOrganizationData, fetchSegmentData, sortActiveOrganizations } from './dataProcessor'
import { buildCountQuery, buildQuery, buildSearchCTE } from './queryBuilder'
import { IDbMemberAttributeSetting, IDbMemberData } from './types'

import { fetchManyMemberIdentities, fetchManyMemberOrgs, fetchManyMemberSegments } from '.'

export enum MemberField {
  ATTRIBUTES = 'attributes',
  CONTRIBUTIONS = 'contributions',
  CREATED_AT = 'createdAt',
  CREATED_BY_ID = 'createdById',
  DELETED_AT = 'deletedAt',
  DISPLAY_NAME = 'displayName',
  ID = 'id',
  IMPORT_HASH = 'importHash',
  JOINED_AT = 'joinedAt',
  MANUALLY_CHANGED_FIELDS = 'manuallyChangedFields',
  MANUALLY_CREATED = 'manuallyCreated',
  REACH = 'reach',
  SCORE = 'score',
  TENANT_ID = 'tenantId',
  UPDATED_AT = 'updatedAt',
  UPDATED_BY_ID = 'updatedById',
}

export const MEMBER_MERGE_FIELDS = [
  'affiliations',
  'attributes',
  'contributions',
  'displayName',
  'id',
  'joinedAt',
  'manuallyChangedFields',
  'manuallyCreated',
  'reach',
  'tags',
  'tasks',
  'tenantId',
]

export const MEMBER_UPDATE_COLUMNS = [
  MemberField.ATTRIBUTES,
  MemberField.CONTRIBUTIONS,
  MemberField.DISPLAY_NAME,
  MemberField.IMPORT_HASH,
  MemberField.REACH,
  MemberField.SCORE,
]

export const MEMBER_SELECT_COLUMNS = [
  'attributes',
  'displayName',
  'id',
  'joinedAt',
  'manuallyChangedFields',
  'reach',
  'score',
]

export const MEMBER_INSERT_COLUMNS = [
  'attributes',
  'createdAt',
  'displayName',
  'id',
  'joinedAt',
  'reach',
  'tenantId',
  'updatedAt',
]

const QUERY_FILTER_COLUMN_MAP: Map<string, { name: string; queryable?: boolean }> = new Map([
  ['activityCount', { name: 'msa."activityCount"' }],
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

export async function queryMembersAdvanced(
  qx: QueryExecutor,
  redis: RedisClient,
  {
    filter = {},
    search = null,
    limit = 20,
    offset = 0,
    orderBy = 'activityCount_DESC',
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
  const withAggregates = !!segmentId
  const searchConfig = buildSearchCTE(search)

  const params = {
    limit,
    offset,
    segmentId,
    ...searchConfig.params,
  }

  const filterString = RawQueryParser.parseFilters(
    filter,
    new Map([...QUERY_FILTER_COLUMN_MAP.entries()].map(([key, { name }]) => [key, name])),
    [
      {
        property: 'attributes',
        column: 'm.attributes',
        attributeInfos: [
          ...(attributeSettings?.length > 0
            ? attributeSettings
            : await getMemberAttributeSettings(qx, redis)),
          {
            name: 'jobTitle',
            type: MemberAttributeType.STRING,
          },
        ],
      },
      {
        property: 'username',
        column: 'aggs.username',
        attributeInfos: ALL_PLATFORM_TYPES.map((name) => ({
          name,
          type: MemberAttributeType.STRING,
        })),
      },
    ],
    params,
    { pgPromiseFormat: true },
  )

  // Build queries
  const countQuery = buildCountQuery({
    withAggregates,
    searchConfig,
    filterString,
    includeMemberOrgs: include.memberOrganizations,
  })

  if (countOnly) {
    const result = await qx.selectOne(countQuery, params)
    return {
      rows: [],
      count: parseInt(result.count, 10),
      limit,
      offset,
    }
  }

  // Prepare fields for main query
  const preparedFields = fields
    .map((f) => {
      const mappedField = QUERY_FILTER_COLUMN_MAP.get(f)
      if (!mappedField) {
        throw new Error400('en', `Invalid field: ${f}`)
      }
      return { alias: f, ...mappedField }
    })
    .filter((mappedField) => mappedField.queryable !== false)
    .filter((mappedField) => {
      if (!withAggregates && mappedField.name.includes('msa.')) return false
      if (!include.memberOrganizations && mappedField.name.includes('mo.')) return false
      return true
    })
    .map((mappedField) => `${mappedField.name} AS "${mappedField.alias}"`)
    .join(',\n')

  const mainQuery = buildQuery({
    fields: preparedFields,
    withAggregates,
    includeMemberOrgs: include.memberOrganizations,
    searchConfig,
    filterString,
    orderBy,
    limit,
    offset,
  })

  // Execute queries in parallel
  const [rows, countResult] = await Promise.all([
    qx.select(mainQuery, params),
    qx.selectOne(countQuery, params),
  ])

  const count = parseInt(countResult.count, 10)
  const memberIds = rows.map((org) => org.id)

  if (memberIds.length === 0) {
    return { rows: [], count, limit, offset }
  }

  const [memberOrganizations, identities, memberSegments, maintainerRoles] = await Promise.all([
    include.memberOrganizations ? fetchManyMemberOrgs(qx, memberIds) : Promise.resolve([]),
    include.identities ? fetchManyMemberIdentities(qx, memberIds) : Promise.resolve([]),
    include.segments ? fetchManyMemberSegments(qx, memberIds) : Promise.resolve([]),
    include.maintainers ? findMaintainerRoles(qx, memberIds) : Promise.resolve([]),
  ])

  // Second parallel batch - fetch related data
  const [orgExtra, segmentsInfo, maintainerSegmentsInfo] = await Promise.all([
    include.memberOrganizations
      ? fetchOrganizationData(qx, memberOrganizations)
      : Promise.resolve({ orgs: [], lfx: [] }),
    include.segments ? fetchSegmentData(qx, memberSegments) : Promise.resolve([]),
    include.maintainers && maintainerRoles.length > 0
      ? fetchManySegments(qx, uniq(maintainerRoles.map((m) => m.segmentId)))
      : Promise.resolve([]),
  ])

  // Data processing section

  if (include.memberOrganizations) {
    const { orgs = [], lfx = [] } = orgExtra

    for (const member of rows) {
      member.organizations = []

      const memberOrgs =
        memberOrganizations.find((o) => o.memberId === member.id)?.organizations || []

      const activeOrgs = memberOrgs.filter((org) => !org.dateEnd)

      const sortedActiveOrgs = sortActiveOrganizations(activeOrgs, orgs)

      const activeOrg = sortedActiveOrgs[0]

      if (activeOrg) {
        const orgInfo = orgs.find((odn) => odn.id === activeOrg.organizationId)

        if (orgInfo) {
          const lfxMembership = lfx.find((m) => m.organizationId === activeOrg.organizationId)
          member.organizations = [
            {
              id: activeOrg.organizationId,
              displayName: orgInfo.displayName || '',
              logo: orgInfo.logo || '',
              lfxMembership: !!lfxMembership,
            },
          ]
        }
      }
    }
  }

  if (include.segments) {
    const segmentProcessingStart = Date.now()
    const segments = segmentsInfo || []

    rows.forEach((member) => {
      member.segments = (memberSegments.find((i) => i.memberId === member.id)?.segments || [])
        .map((segment) => {
          const segmentInfo = segments.find((s) => s.id === segment.segmentId)

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
    const maintainerProcessingStart = Date.now()
    const groupedMaintainers = groupBy(maintainerRoles, (m) => m.memberId)
    rows.forEach((member) => {
      member.maintainerRoles = (groupedMaintainers.get(member.id) || []).map((role) => {
        const segmentInfo = maintainerSegmentsInfo.find((s) => s.id === role.segmentId)
        return {
          ...role,
          segmentName: segmentInfo?.name,
        }
      })
    })
  }

  if (include.identities) {
    rows.forEach((member) => {
      const memberIdentities = identities.find((i) => i.memberId === member.id)?.identities || []

      member.identities = memberIdentities.map((identity) => ({
        type: identity.type,
        value: identity.value,
        platform: identity.platform,
        verified: identity.verified,
      }))
    })
  }

  return { rows, count, limit, offset }
}

// ...existing code... (resto delle funzioni rimangono uguali)
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
  const params: Record<string, string> = {
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
