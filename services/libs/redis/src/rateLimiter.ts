import { ICache, IRateLimiter, RateLimitError } from '@crowd/types'
import { timeout } from '@crowd/common'

export class RateLimiter implements IRateLimiter {
  constructor(
    private readonly cache: ICache,
    private readonly maxRequests: number,
    private readonly timeWindowSeconds: number,
    private readonly counterKey: string,
  ) {
    this.cache = cache
    this.maxRequests = maxRequests
    this.timeWindowSeconds = timeWindowSeconds
    this.counterKey = counterKey
  }

  public async checkRateLimit(endpoint: string) {
    const value = await this.cache.get(this.counterKey)
    const requestCount = value === null ? 0 : parseInt(value)
    const canMakeRequest = requestCount < this.maxRequests

    if (!canMakeRequest) {
      const sleepTime = this.timeWindowSeconds + Math.floor(Math.random() * this.maxRequests)
      throw new RateLimitError(sleepTime, endpoint)
    }
  }

  public async incrementRateLimit() {
    await this.cache.increment(this.counterKey, 1, this.timeWindowSeconds)
  }
}

export class ConcurrentRequestLimiter {
  constructor(
    private readonly cache: ICache,
    private readonly maxConcurrentRequests: number,
    private readonly requestKey: string,
  ) {
    this.cache = cache
    this.maxConcurrentRequests = maxConcurrentRequests
    this.requestKey = requestKey
  }

  public async checkConcurrentRequestLimit(integrationId: string, retries = 5, sleepTimeMs = 1000) {
    const key = this.getRequestKey(integrationId)
    const value = await this.cache.get(key)
    const currentRequests = value === null ? 0 : parseInt(value)
    const canMakeRequest = currentRequests < this.maxConcurrentRequests

    if (!canMakeRequest) {
      if (retries > 0) {
        await timeout(sleepTimeMs)
        return this.checkConcurrentRequestLimit(integrationId, retries - 1, sleepTimeMs)
      } else {
        throw new Error(`Too many concurrent requests for integration ${integrationId}`)
      }
    }
  }

  public async incrementConcurrentRequest(integrationId: string) {
    const key = this.getRequestKey(integrationId)
    await this.cache.increment(key, 1)
  }

  public async decrementConcurrentRequest(integrationId: string) {
    const key = this.getRequestKey(integrationId)
    await this.cache.decrement(key, 1)
  }

  public async processWithLimit<T>(integrationId: string, func: () => Promise<T>): Promise<T> {
    await this.checkConcurrentRequestLimit(integrationId)
    await this.incrementConcurrentRequest(integrationId)

    try {
      return await func()
    } finally {
      await this.decrementConcurrentRequest(integrationId)
    }
  }

  private getRequestKey(integrationId: string) {
    return `${this.requestKey}:${integrationId}`
  }
}
