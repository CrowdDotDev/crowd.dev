import { uniq } from 'lodash'

import {
  DEFAULT_TENANT_ID,
  Error400,
  RawQueryParser,
  generateUUIDv1,
  getProperDisplayName,
} from '@crowd/common'
import { formatSql, getDbInstance, prepareForModification } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  ALL_PLATFORM_TYPES,
  MemberAttributeType,
  MemberIdentityType,
  PageData,
  SegmentData,
  SegmentType,
} from '@crowd/types'

import { LfxMembership, findManyLfxMemberships } from '../lfx_memberships'
import {
  IDbMemberCreateData,
  IDbMemberUpdateData,
} from '../old/apps/data_sink_worker/repo/member.data'
import { OrganizationField, queryOrgs } from '../organizations'
import { QueryExecutor } from '../queryExecutor'
import { fetchManySegments } from '../segments'
import { QueryOptions, QueryResult, queryTable, queryTableById } from '../utils'

import { getMemberAttributeSettings } from './attributeSettings'
import { IDbMemberAttributeSetting, IDbMemberData } from './types'

import { fetchManyMemberIdentities, fetchManyMemberOrgs, fetchManyMemberSegments } from '.'

const log = getServiceLogger()
interface MemberOrganization {
  id: string
  organizationId: string
  dateStart?: string
  dateEnd?: string
  affiliationOverride?: {
    isPrimaryWorkExperience?: boolean
  }
}

interface MemberOrganizationData {
  memberId: string
  organizations: MemberOrganization[]
}

interface OrganizationInfo {
  id: string
  displayName: string
  logo: string
  createdAt: string
}

interface MemberSegmentData {
  memberId: string
  segments: Array<{
    segmentId: string
    activityCount: number
  }>
}

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
  ['activityCount', { name: 'coalesce(msa."activityCount", 0)::integer' }],
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

// const QUERY_FILTER_ATTRIBUTE_MAP = ['avatarUrl', 'isBot', 'isTeamMember', 'jobTitle']

const getOrderClause = (orderBy: string, withAggregates: boolean): string => {
  const defaultOrder = withAggregates ? 'msa."activityCount" DESC' : 'm."joinedAt" DESC'

  if (!orderBy || typeof orderBy !== 'string' || !orderBy.length) {
    return defaultOrder
  }

  const [fieldName, direction = 'DESC'] = orderBy.split('_')
  const orderField = QUERY_FILTER_COLUMN_MAP.get(fieldName)?.name

  if (!orderField) {
    return defaultOrder
  }

  const orderDirection = ['DESC', 'ASC'].includes(direction) ? direction : 'DESC'
  return `${orderField} ${orderDirection}`
}

const buildSearchCTE = (
  search: string,
): { cte: string; join: string; params: Record<string, string> } => {
  if (!search?.trim()) {
    return { cte: '', join: '', params: {} }
  }

  const searchTerm = search.toLowerCase().trim()

  return {
    cte: `
      member_search AS (
        SELECT DISTINCT mi."memberId"
        FROM "memberIdentities" mi
        INNER JOIN members m ON m.id = mi."memberId"
        WHERE (
          (mi.verified = true AND mi.type = $(emailType) AND LOWER(mi."value") LIKE $(searchPattern))
          OR LOWER(m."displayName") LIKE $(searchPattern)
        )
      )`,
    join: `INNER JOIN member_search ms ON ms."memberId" = m.id`,
    params: {
      emailType: MemberIdentityType.EMAIL,
      searchPattern: `%${searchTerm}%`,
    },
  }
}

const buildMemberOrgsCTE = (includeMemberOrgs: boolean): string => {
  if (!includeMemberOrgs) return ''

  return `
    member_orgs AS (
      SELECT
        "memberId",
        ARRAY_AGG("organizationId"::TEXT) AS "organizationId"
      FROM "memberOrganizations"
      WHERE "deletedAt" IS NULL
      GROUP BY "memberId"
    )`
}

const buildQuery = (
  fields: string,
  withAggregates: boolean,
  includeMemberOrgs: boolean,
  searchConfig: { cte: string; join: string },
  filterString: string,
): string => {
  const ctes = [buildMemberOrgsCTE(includeMemberOrgs), searchConfig.cte].filter(Boolean)

  const joins = [
    withAggregates
      ? `INNER JOIN "memberSegmentsAgg" msa ON msa."memberId" = m.id AND msa."segmentId" = $(segmentId)`
      : '',
    includeMemberOrgs ? `LEFT JOIN member_orgs mo ON mo."memberId" = m.id` : '',
    `LEFT JOIN "memberEnrichments" me ON me."memberId" = m.id`,
    searchConfig.join,
  ].filter(Boolean)

  return `
    ${ctes.length > 0 ? `WITH ${ctes.join(',\n')}` : ''}
    SELECT ${fields}
    FROM members m
    ${joins.join('\n')}
    WHERE (${filterString})
  `.trim()
}

const sortActiveOrganizations = (
  activeOrgs: MemberOrganization[],
  organizationsInfo: OrganizationInfo[],
): MemberOrganization[] => {
  return activeOrgs.sort((a, b) => {
    if (!a || !b) return 0

    // First priority: isPrimaryWorkExperience
    const aPrimary = a.affiliationOverride?.isPrimaryWorkExperience === true
    const bPrimary = b.affiliationOverride?.isPrimaryWorkExperience === true

    if (aPrimary !== bPrimary) return aPrimary ? -1 : 1

    // Second priority: has dateStart
    const aHasDate = !!a.dateStart
    const bHasDate = !!b.dateStart

    if (aHasDate !== bHasDate) return aHasDate ? -1 : 1

    // Third priority: createdAt and alphabetical
    if (!a.dateStart && !b.dateStart) {
      const aOrgInfo = organizationsInfo.find((odn) => odn.id === a.organizationId)
      const bOrgInfo = organizationsInfo.find((odn) => odn.id === b.organizationId)

      const aCreatedAt = aOrgInfo?.createdAt ? new Date(aOrgInfo.createdAt).getTime() : 0
      const bCreatedAt = bOrgInfo?.createdAt ? new Date(bOrgInfo.createdAt).getTime() : 0

      if (aCreatedAt !== bCreatedAt) return bCreatedAt - aCreatedAt

      const aName = (aOrgInfo?.displayName || '').toLowerCase()
      const bName = (bOrgInfo?.displayName || '').toLowerCase()
      return aName.localeCompare(bName)
    }

    return 0
  })
}

const fetchOrganizationData = async (
  qx: QueryExecutor,
  memberOrganizations: MemberOrganizationData[],
): Promise<{ orgs: OrganizationInfo[]; lfx: LfxMembership[] }> => {
  if (memberOrganizations.length === 0) {
    return { orgs: [], lfx: [] }
  }

  const orgIds = uniq(
    memberOrganizations.reduce((acc, mo) => {
      acc.push(...mo.organizations.map((o) => o.organizationId))
      return acc
    }, []),
  )

  if (orgIds.length === 0) {
    return { orgs: [], lfx: [] }
  }

  const [orgs, lfx] = await Promise.all([
    queryOrgs(qx, {
      filter: { [OrganizationField.ID]: { in: orgIds } },
      fields: [
        OrganizationField.ID,
        OrganizationField.DISPLAY_NAME,
        OrganizationField.LOGO,
        OrganizationField.CREATED_AT,
      ],
    }),
    findManyLfxMemberships(qx, { organizationIds: orgIds }),
  ])

  return { orgs, lfx }
}

const fetchSegmentData = async (
  qx: QueryExecutor,
  memberSegments: MemberSegmentData[],
): Promise<SegmentData[]> => {
  if (memberSegments.length === 0) {
    return []
  }

  const segmentIds = uniq(
    memberSegments.reduce((acc, ms) => {
      acc.push(...ms.segments.map((s) => s.segmentId))
      return acc
    }, []),
  )

  return segmentIds.length > 0 ? fetchManySegments(qx, segmentIds) : []
}

export async function queryMembersAdvanced(
  qx: QueryExecutor,
  redis: RedisClient,
  {
    filter = {},
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
  const startTime = Date.now()

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
          // TODO: ci serve questo ?
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
  const countQuery = buildQuery(
    'COUNT(*) as count',
    withAggregates,
    include.memberOrganizations,
    searchConfig,
    filterString,
  )

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
  const fieldsStartTime = Date.now()
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
  log.info(`[PERF] Field preparation took: ${Date.now() - fieldsStartTime}ms`)

  const mainQuery = `
    ${buildQuery(
      preparedFields,
      withAggregates,
      include.memberOrganizations,
      searchConfig,
      filterString,
    )}
    ORDER BY ${getOrderClause(orderBy, withAggregates)} NULLS LAST
    LIMIT $(limit)
    OFFSET $(offset)
  `

  log.info(`main query: ${formatSql(mainQuery, params)}`)
  log.info(`count query: ${formatSql(countQuery, params)}`)

  // Execute queries in parallel
  const mainQueryStartTime = Date.now()

  const [rows, countResult] = await Promise.all([
    qx.select(mainQuery, params),
    qx.selectOne(countQuery, params),
  ])
  const mainQueryDuration = Date.now() - mainQueryStartTime
  log.info(
    `[PERF] Main queries (parallel) took: ${mainQueryDuration}ms - returned ${rows.length} rows`,
  )

  // TODO: ci serve davvero questo filtro ?
  // rows.forEach((row) => {
  //   if (row.attributes && typeof row.attributes === 'object') {
  //     const filteredAttributes = {}
  //     QUERY_FILTER_ATTRIBUTE_MAP.forEach((attr) => {
  //       if (row.attributes[attr] !== undefined) {
  //         filteredAttributes[attr] = row.attributes[attr]
  //       }
  //     })
  //     row.attributes = filteredAttributes
  //   }
  // })

  const count = parseInt(countResult.count, 10)
  const memberIds = rows.map((org) => org.id)

  if (memberIds.length === 0) {
    // TODO: if memberIds is empty the count is 0 ?, if yes we can skip the count query
    return { rows: [], count, limit, offset }
  }

  // const [memberOrganizations, identities, memberSegments, maintainerRoles] = await Promise.all([
  //   include.memberOrganizations ? fetchManyMemberOrgs(qx, memberIds) : Promise.resolve([]),
  //   include.identities ? fetchManyMemberIdentities(qx, memberIds) : Promise.resolve([]),
  //   include.segments ? fetchManyMemberSegments(qx, memberIds) : Promise.resolve([]),
  //   include.maintainers ? findMaintainerRoles(qx, memberIds) : Promise.resolve([]),
  // ])
  const firstBatchStartTime = Date.now()

  // const [memberOrganizations, identities, memberSegments, maintainerRoles] = await Promise.all([
  const [memberOrganizations, identities, memberSegments] = await Promise.all([
    include.memberOrganizations
      ? (async () => {
          const start = Date.now()
          const result = await fetchManyMemberOrgs(qx, memberIds)
          log.info(`[PERF] fetchManyMemberOrgs took: ${Date.now() - start}ms`)
          return result
        })()
      : Promise.resolve([]),
    include.identities
      ? (async () => {
          const start = Date.now()
          const result = await fetchManyMemberIdentities(qx, memberIds)
          log.info(`[PERF] fetchManyMemberIdentities took: ${Date.now() - start}ms`)
          return result
        })()
      : Promise.resolve([]),
    include.segments
      ? (async () => {
          const start = Date.now()
          const result = await fetchManyMemberSegments(qx, memberIds)
          log.info(`[PERF] fetchManyMemberSegments took: ${Date.now() - start}ms`)
          return result
        })()
      : Promise.resolve([]),
    // include.maintainers
    //   ? (async () => {
    //       const start = Date.now()
    //       const result = await findMaintainerRoles(qx, memberIds)
    //       log.info(`[PERF] findMaintainerRoles took: ${Date.now() - start}ms`)
    //       return result
    //     })()
    //   : Promise.resolve([]),
  ])
  const firstBatchDuration = Date.now() - firstBatchStartTime
  log.info(`[PERF] First parallel batch took: ${firstBatchDuration}ms`)

  // const [orgExtra, segmentsInfo, maintainerSegmentsInfo] = await Promise.all([
  //   include.memberOrganizations
  //     ? fetchOrganizationData(qx, memberOrganizations)
  //     : Promise.resolve({ orgs: [], lfx: [] }),
  //   include.segments ? fetchSegmentData(qx, memberSegments) : Promise.resolve([]),
  //   include.maintainers && maintainerRoles.length > 0
  //     ? fetchManySegments(qx, uniq(maintainerRoles.map((m) => m.segmentId)))
  //     : Promise.resolve([]),
  // ])

  // if (include.memberOrganizations) {
  //   const { orgs = [], lfx = [] } = orgExtra

  //   for (const member of rows) {
  //     member.organizations = []

  //     const memberOrgs =
  //       memberOrganizations.find((o) => o.memberId === member.id)?.organizations || []

  //     const activeOrgs = memberOrgs.filter((org) => !org.dateEnd)

  //     const sortedActiveOrgs = sortActiveOrganizations(activeOrgs, orgs)

  //     const activeOrg = sortedActiveOrgs[0]

  //     if (activeOrg) {
  //       const orgInfo = orgs.find((odn) => odn.id === activeOrg.organizationId)

  //       if (orgInfo) {
  //         const lfxMembership = lfx.find((m) => m.organizationId === activeOrg.organizationId)
  //         member.organizations = [
  //           {
  //             id: activeOrg.organizationId,
  //             displayName: orgInfo.displayName || '',
  //             logo: orgInfo.logo || '',
  //             lfxMembership: !!lfxMembership,
  //           },
  //         ]
  //       }
  //     }
  //   }
  // }

  // if (include.segments) {
  //   const segments = segmentsInfo || []

  //   rows.forEach((member) => {
  //     member.segments = (memberSegments.find((i) => i.memberId === member.id)?.segments || [])
  //       .map((segment) => {
  //         const segmentInfo = segments.find((s) => s.id === segment.segmentId)

  //         if (include.onlySubProjects && segmentInfo?.type !== SegmentType.SUB_PROJECT) {
  //           return null
  //         }

  //         return {
  //           id: segment.segmentId,
  //           name: segmentInfo?.name,
  //           activityCount: segment.activityCount,
  //         }
  //       })
  //       .filter(Boolean)
  //   })
  // }

  // if (include.maintainers) {
  //   const groupedMaintainers = groupBy(maintainerRoles, (m) => m.memberId)
  //   rows.forEach((member) => {
  //     member.maintainerRoles = (groupedMaintainers.get(member.id) || []).map((role) => {
  //       const segmentInfo = maintainerSegmentsInfo.find((s) => s.id === role.segmentId)
  //       return {
  //         ...role,
  //         segmentName: segmentInfo?.name,
  //       }
  //     })
  //   })
  // }

  // if (include.identities) {
  //   rows.forEach((member) => {
  //     const memberIdentities = identities.find((i) => i.memberId === member.id)?.identities || []

  //     member.identities = memberIdentities.map((identity) => ({
  //       type: identity.type,
  //       value: identity.value,
  //       platform: identity.platform,
  //       verified: identity.verified,
  //     }))
  //   })
  // }

  // Second parallel batch - fetch related data
  const secondBatchStartTime = Date.now()
  // const [orgExtra, segmentsInfo, maintainerSegmentsInfo] = await Promise.all([
  const [orgExtra, segmentsInfo] = await Promise.all([
    include.memberOrganizations
      ? (async () => {
          const start = Date.now()
          const result = await fetchOrganizationData(qx, memberOrganizations)
          log.info(`[PERF] fetchOrganizationData took: ${Date.now() - start}ms`)
          return result
        })()
      : Promise.resolve({ orgs: [], lfx: [] }),
    include.segments
      ? (async () => {
          const start = Date.now()
          const result = await fetchSegmentData(qx, memberSegments)
          log.info(`[PERF] fetchSegmentData took: ${Date.now() - start}ms`)
          return result
        })()
      : Promise.resolve([]),
    // include.maintainers && maintainerRoles.length > 0
    //   ? (async () => {
    //       const start = Date.now()
    //       const segmentIds = uniq(maintainerRoles.map((m) => m.segmentId))
    //       const result = await fetchManySegments(qx, segmentIds)
    //       log.info(
    //         `[PERF] fetchManySegments for maintainers (${segmentIds.length} segments) took: ${Date.now() - start}ms`,
    //       )
    //       return result
    //     })()
    //   : Promise.resolve([]),
  ])
  const secondBatchDuration = Date.now() - secondBatchStartTime
  log.info(`[PERF] Second parallel batch took: ${secondBatchDuration}ms`)

  // Data processing section
  const processingStartTime = Date.now()

  if (include.memberOrganizations) {
    const orgProcessingStart = Date.now()
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
    log.info(`[PERF] Member organizations processing took: ${Date.now() - orgProcessingStart}ms`)
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
    log.info(`[PERF] Segments processing took: ${Date.now() - segmentProcessingStart}ms`)
  }

  // if (include.maintainers) {
  //   const maintainerProcessingStart = Date.now()
  //   const groupedMaintainers = groupBy(maintainerRoles, (m) => m.memberId)
  //   rows.forEach((member) => {
  //     member.maintainerRoles = (groupedMaintainers.get(member.id) || []).map((role) => {
  //       const segmentInfo = maintainerSegmentsInfo.find((s) => s.id === role.segmentId)
  //       return {
  //         ...role,
  //         segmentName: segmentInfo?.name,
  //       }
  //     })
  //   })
  //   log.info(`[PERF] Maintainer roles processing took: ${Date.now() - maintainerProcessingStart}ms`)
  // }

  if (include.identities) {
    const identityProcessingStart = Date.now()
    rows.forEach((member) => {
      const memberIdentities = identities.find((i) => i.memberId === member.id)?.identities || []

      member.identities = memberIdentities.map((identity) => ({
        type: identity.type,
        value: identity.value,
        platform: identity.platform,
        verified: identity.verified,
      }))
    })
    log.info(`[PERF] Identities processing took: ${Date.now() - identityProcessingStart}ms`)
  }

  const processingDuration = Date.now() - processingStartTime
  log.info(`[PERF] Total data processing took: ${processingDuration}ms`)

  const totalDuration = Date.now() - startTime
  log.info(`[PERF] Total queryMembersAdvanced took: ${totalDuration}ms`)
  log.info(
    `[PERF] Breakdown - Main queries: ${mainQueryDuration}ms (${((mainQueryDuration / totalDuration) * 100).toFixed(1)}%), First batch: ${firstBatchDuration}ms (${((firstBatchDuration / totalDuration) * 100).toFixed(1)}%), Second batch: ${secondBatchDuration}ms (${((secondBatchDuration / totalDuration) * 100).toFixed(1)}%), Processing: ${processingDuration}ms (${((processingDuration / totalDuration) * 100).toFixed(1)}%)`,
  )

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
