import { getServiceLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { PageData } from '@crowd/types'

import { IDbMemberData } from './types'

const log = getServiceLogger()

export class MemberQueryCache {
  private cache: RedisCache
  private countCache: RedisCache

  constructor(redis: RedisClient) {
    this.cache = new RedisCache('members-advanced', redis, log)
    this.countCache = new RedisCache('members-count', redis, log)
  }

  buildCacheKey(params: {
    countOnly?: boolean
    fields?: string[]
    filter?: any
    include?: any
    limit: number
    offset: number
    orderBy?: string
    search?: string
    segmentId?: string
  }): string {
    const cleanParams = Object.fromEntries(
      Object.entries({
        countOnly: params.countOnly,
        fields: params.fields?.sort(),
        filter: params.filter,
        include: params.include,
        limit: params.limit,
        offset: params.offset,
        orderBy: params.orderBy,
        search: params.search,
        segmentId: params.segmentId,
      }).filter(([_, value]) => value !== null && value !== undefined),
    )

    const crypto = require('crypto')
    const hash = crypto.createHash('md5').update(JSON.stringify(cleanParams)).digest('hex')
    return `members_advanced_${hash}`
  }

  async get(cacheKey: string): Promise<PageData<IDbMemberData> | null> {
    try {
      const cachedResult = await this.cache.get(cacheKey)
      if (cachedResult) {
        log.debug(`Cache hit for members query: ${cacheKey}`)
        return JSON.parse(cachedResult)
      }
      log.debug(`Cache miss for members query: ${cacheKey}`)
      return null
    } catch (error) {
      log.warn('Error retrieving from cache', { error })
      return null
    }
  }

  async set(cacheKey: string, result: PageData<IDbMemberData>, ttlSeconds: number): Promise<void> {
    try {
      await this.cache.set(cacheKey, JSON.stringify(result), ttlSeconds)
      log.info(`Cached members query result: ${cacheKey}`)
    } catch (error) {
      log.warn('Error saving to cache', { error })
    }
  }

  async getCount(cacheKey: string): Promise<number | null> {
    const cachedCount = await this.countCache.get(cacheKey)
    return cachedCount ? parseInt(cachedCount, 10) : null
  }

  async setCount(cacheKey: string, count: number, ttlSeconds: number): Promise<void> {
    await this.countCache.set(cacheKey, count.toString(), ttlSeconds)
  }
}
