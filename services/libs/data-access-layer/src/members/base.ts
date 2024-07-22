import { Error400, RawQueryParser } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  ActivityDisplayVariant,
  ALL_PLATFORM_TYPES,
  MemberAttributeType,
  MemberIdentityType,
  PageData,
} from '@crowd/types'
import { uniq } from 'lodash'
import { fetchManyMemberIdentities, fetchManyMemberOrgs, fetchManyMemberSegments } from '.'
import { QueryExecutor } from '../queryExecutor'
import { fetchManySegments, findSegmentById, getSegmentActivityTypes } from '../segments'
import { QueryOptions, QueryResult, queryTable, queryTableById } from '../utils'
import { getMemberAttributeSettings } from './attributeSettings'
import { IDbMemberAttributeSetting, IDbMemberData } from './types'
import { OrganizationField, queryOrgs } from '../orgs'
import { findManyLfxMemberships } from '../lfx_memberships'
import { ActivityDisplayService } from '@crowd/integrations'

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

  ENRICHED_BY = 'enrichedBy',
  LAST_ENRICHED_AT = 'lastEnrichedAt',
  SEARCH_SYNCED_AT = 'searchSyncedAt',

  MANUALLY_CREATED = 'manuallyCreated',
  MANUALLY_CHANGED_FIELDS = 'manuallyChangedFields',
}

const QUERY_FILTER_COLUMN_MAP: Map<string, { name: string; queryable?: boolean }> = new Map([
  // id fields
  ['id', { name: 'm.id' }],
  ['segmentId', { name: 'msa."segmentId"' }],

  // member fields
  ['displayName', { name: 'm."displayName"' }],
  ['reach', { name: 'm.reach' }],
  // ['tags', {name: 'm."tags"'}], // ignore, not used
  ['joinedAt', { name: 'm."joinedAt"' }],
  ['jobTitle', { name: `m.attributes -> 'jobTitle' ->> 'default'` }],
  ['numberOfOpenSourceContributions', { name: 'coalesce(jsonb_array_length(m.contributions), 0)' }],
  ['isBot', { name: `COALESCE((m.attributes -> 'isBot' ->> 'default')::BOOLEAN, FALSE)` }],
  [
    'isTeamMember',
    { name: `COALESCE((m.attributes -> 'isTeamMember' ->> 'default')::BOOLEAN, FALSE)` },
  ],
  [
    'isOrganization',
    { name: `COALESCE((m.attributes -> 'isOrganization' ->> 'default')::BOOLEAN, FALSE)` },
  ],

  // member agg fields
  ['lastActive', { name: 'msa."lastActive"' }],
  ['identityPlatforms', { name: 'msa."activeOn"' }],
  ['lastEnriched', { name: 'm."lastEnriched"' }],
  ['score', { name: 'm.score' }],
  ['averageSentiment', { name: 'msa."averageSentiment"' }],
  ['activityTypes', { name: 'msa."activityTypes"' }],
  ['activeOn', { name: 'msa."activeOn"' }],
  ['activityCount', { name: 'msa."activityCount"' }],

  // others
  ['organizations', { name: 'mo."organizationId"', queryable: false }],

  // fields for querying
  ['attributes', { name: 'm.attributes' }],
])

export async function queryMembersAdvanced(
  qx: QueryExecutor,
  redis: RedisClient,
  tenantId: string,
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
    } as {
      identities?: boolean
      segments?: boolean
      lfxMemberships?: boolean
      memberOrganizations?: boolean
    },
    attributeSettings = [] as IDbMemberAttributeSetting[],
  },
): Promise<PageData<IDbMemberData>> {
  if (!attributeSettings) {
    attributeSettings = await getMemberAttributeSettings(qx, redis, tenantId)
  }

  const withAggregates = !!segmentId
  let segment
  if (withAggregates) {
    segment = await findSegmentById(qx, segmentId)

    if (segment === null) {
      log.info('No segment found for member query. Returning empty result.')
      return {
        rows: [],
        count: 0,
        limit,
        offset,
      }
    }
  }

  const params = {
    limit,
    offset,
    tenantId,
    segmentId: segment?.id,
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
  })(orderBy)

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
          ? ` JOIN "memberSegmentsAgg" msa ON msa."memberId" = m.id AND msa."segmentId" = $(segmentId)`
          : ''
      }
      LEFT JOIN member_orgs mo ON mo."memberId" = m.id
      ${searchJoin}
      WHERE m."tenantId" = $(tenantId)
        AND (${filterString})
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
          fields: [OrganizationField.ID, OrganizationField.DISPLAY_NAME, OrganizationField.LOGO],
        })
      : []

    rows.forEach((member) => {
      member.organizations = (
        memberOrganizations.find((o) => o.memberId === member.id)?.organizations || []
      ).map((o) => ({
        id: o.organizationId,
        ...orgExtra.find((odn) => odn.id === o.organizationId),
        memberOrganizations: o,
      }))
    })
  }
  if (include.lfxMemberships) {
    const lfxMemberships = await findManyLfxMemberships(qx, {
      organizationIds: uniq(
        rows.reduce((acc, r) => {
          if (r.organizations) {
            acc.push(...r.organizations.map((o) => o.id))
          }
          return acc
        }, []),
      ),
      tenantId,
    })

    rows.forEach((member) => {
      if (member.organizations) {
        member.organizations.forEach((o) => {
          o.lfxMembership = lfxMemberships.find((m) => m.organizationId === o.id)
        })
      }
    })
  }
  if (include.identities) {
    const identities = await fetchManyMemberIdentities(qx, memberIds)

    rows.forEach((member) => {
      member.identities = identities.find((i) => i.memberId === member.id)?.identities || []
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
      member.segments = (memberSegments.find((i) => i.memberId === member.id)?.segments || []).map(
        (segment) => ({
          id: segment.segmentId,
          name: segmentsInfo.find((s) => s.id === segment.segmentId)?.name,
          activityCount: segment.activityCount,
        }),
      )
    })
  }

  rows.forEach((row) => {
    row.tags = []
  })

  if (memberIds.length > 0) {
    // const lastActivities = await seq.query(
    //   `
    //           SELECT
    //               a.*
    //           FROM (
    //               VALUES
    //                 ${memberIds.map((id) => `('${id}')`).join(',')}
    //           ) m ("memberId")
    //           JOIN activities a ON (a.id = (
    //               SELECT id
    //               FROM mv_activities_cube
    //               WHERE "memberId" = m."memberId"::uuid
    //               ORDER BY timestamp DESC
    //               LIMIT 1
    //           ))
    //           WHERE a."tenantId" = :tenantId
    //       `,
    //   {
    //     replacements: {
    //       tenantId: options.currentTenant.id,
    //     },
    //     type: QueryTypes.SELECT,
    //   },
    // )

    // TODO questdb fix above query to questdb activities table
    const lastActivities = []
    rows.forEach((r) => {
      r.lastActivity = lastActivities.find((a) => (a as any).memberId === r.id)
      if (r.lastActivity) {
        r.lastActivity.display = ActivityDisplayService.getDisplayOptions(
          r.lastActivity,
          getSegmentActivityTypes([segment]),
          [ActivityDisplayVariant.SHORT, ActivityDisplayVariant.CHANNEL],
        )
      }
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
