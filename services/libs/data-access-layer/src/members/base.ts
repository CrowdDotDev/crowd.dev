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
import { getServiceLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
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
import { MemberQueryCache } from './queryCache'
import { MemberDetailsCompletion } from './queryDetailsCompletition'
import { handleCountOnlyQuery, prepareQueries } from './queryHelper'
import { IDbMemberAttributeSetting, IDbMemberData } from './types'

import { fetchManyMemberIdentities, fetchManyMemberOrgs, fetchManyMemberSegments } from '.'

const log = getServiceLogger()

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

export const QUERY_FILTER_COLUMN_MAP: Map<string, { name: string; queryable?: boolean }> = new Map([
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
    useCache = true,
    cacheTtlSeconds = 300,
  },
): Promise<PageData<IDbMemberData>> {
  const cache = new MemberQueryCache(redis)

  const cacheKey = cache.buildCacheKey({
    countOnly,
    fields,
    filter,
    include,
    limit,
    offset,
    orderBy,
    search,
    segmentId,
  })

  // Try cache first
  if (useCache) {
    const cachedResult = await cache.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }
  }

  // Handle count-only queries
  if (countOnly) {
    return await handleCountOnlyQuery(qx, redis, cache, cacheKey, {
      attributeSettings,
      cacheTtlSeconds,
      fields,
      filter,
      include,
      limit,
      offset,
      orderBy,
      search,
      segmentId,
      useCache,
    })
  }

  // Prepare and execute main queries
  const { mainQuery, countQuery, params } = await prepareQueries(qx, redis, {
    attributeSettings,
    fields,
    filter,
    include,
    limit,
    offset,
    orderBy,
    search,
    segmentId,
  })

  const [rows, countResult] = await Promise.all([
    qx.select(mainQuery, params),
    qx.selectOne(countQuery, params),
  ])

  const count = parseInt(countResult.count, 10)

  if (rows.length === 0) {
    return { rows: [], count, limit, offset }
  }

  // Complete member details using the new completion service
  const detailsCompletion = new MemberDetailsCompletion(qx)
  await detailsCompletion.complete(rows, include)

  const result = { rows, count, limit, offset }

  // Cache the result
  if (useCache) {
    await cache.set(cacheKey, result, cacheTtlSeconds)
  }

  return result
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
