import { Error400, RawQueryParser } from '@crowd/common'
import { RedisClient } from '@crowd/redis'
import { ALL_PLATFORM_TYPES, MemberAttributeType, PageData } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

import { getMemberAttributeSettings } from './attributeSettings'
import { QUERY_FILTER_COLUMN_MAP } from './base'
import { buildCountQuery, buildQuery, buildSearchCTE } from './queryBuilder'
import { MemberQueryCache } from './queryCache'
import { IncludeOptions } from './queryDetailsCompletition'
import { IDbMemberAttributeSetting, IDbMemberData } from './types'

interface MemberFilter {
  and?: Array<Record<string, unknown>>
  or?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export interface QueryPreparationResult {
  mainQuery: string
  countQuery: string
  params: Record<string, unknown>
  preparedFields: string
}

interface QueryPreparationParams {
  filter: MemberFilter
  search: string | null
  limit: number
  offset: number
  orderBy: string
  segmentId: string | undefined
  fields: string[]
  include: IncludeOptions
  attributeSettings: IDbMemberAttributeSetting[]
}

interface CountOnlyQueryParams {
  filter: MemberFilter
  search: string | null
  limit: number
  offset: number
  orderBy: string
  segmentId: string | undefined
  fields: string[]
  include: IncludeOptions
  attributeSettings: IDbMemberAttributeSetting[]
  useCache: boolean
  cacheTtlSeconds: number
}

export async function prepareQueries(
  qx: QueryExecutor,
  redis: RedisClient,
  {
    filter,
    search,
    limit,
    offset,
    orderBy,
    segmentId,
    fields,
    include,
    attributeSettings,
  }: QueryPreparationParams,
): Promise<QueryPreparationResult> {
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

  const countQuery = buildCountQuery({
    withAggregates,
    searchConfig,
    filterString,
    includeMemberOrgs: include.memberOrganizations,
  })

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

  return {
    mainQuery,
    countQuery,
    params,
    preparedFields,
  }
}

export async function handleCountOnlyQuery(
  qx: QueryExecutor,
  redis: RedisClient,
  cache: MemberQueryCache,
  cacheKey: string,
  params: CountOnlyQueryParams,
): Promise<PageData<IDbMemberData>> {
  // Check count cache first
  if (params.useCache) {
    const cachedCount = await cache.getCount(cacheKey)
    if (cachedCount !== null) {
      return {
        rows: [],
        count: cachedCount,
        limit: params.limit,
        offset: params.offset,
      }
    }
  }

  // Execute count query
  const { countQuery, params: queryParams } = await prepareQueries(qx, redis, params)
  const result = await qx.selectOne(countQuery, queryParams)
  const count = parseInt(result.count, 10)

  // Cache count result
  if (params.useCache) {
    await cache.setCount(cacheKey, count, params.cacheTtlSeconds)
  }

  return {
    rows: [],
    count,
    limit: params.limit,
    offset: params.offset,
  }
}
