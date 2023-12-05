import { ICache, IRateLimiter, RateLimitError, IConcurrentRequestLimiter } from '@crowd/types'
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

    if (requestCount === 0) {
      await this.cache.set(this.counterKey, '0', this.timeWindowSeconds)
    }

    if (!canMakeRequest) {
      const sleepTime = this.timeWindowSeconds + Math.floor(Math.random() * this.timeWindowSeconds)
      throw new RateLimitError(sleepTime, endpoint)
    }
  }

  public async incrementRateLimit() {
    await this.cache.increment(this.counterKey, 1)
  }
}

export class ConcurrentRequestLimiter implements IConcurrentRequestLimiter {
  constructor(
    private readonly cache: ICache,
    // max concurrent requests per integrationId
    private readonly maxConcurrentRequests: number,
    private readonly requestKey: string,
    // cache key will be deleted after this time since last increment / decrement
    private readonly maxLockTimeSeconds = 50,
  ) {
    this.cache = cache
    this.maxConcurrentRequests = maxConcurrentRequests
    this.requestKey = requestKey
    this.maxLockTimeSeconds = maxLockTimeSeconds
  }

  public async checkConcurrentRequestLimit(
    integrationId: string,
    retries = 1000,
    sleepTimeMs = 50,
  ) {
    const key = this.getRequestKey(integrationId)
    let currentRequests: number
    let canMakeRequest: boolean

    for (let i = 0; i < retries; i++) {
      const value = await this.cache.get(key)
      currentRequests = value === null ? 0 : parseInt(value)
      canMakeRequest = currentRequests < this.maxConcurrentRequests

      if (!canMakeRequest) {
        const randomizedSleepTime = sleepTimeMs + Math.floor(Math.random() * sleepTimeMs)
        await timeout(randomizedSleepTime)
      } else {
        return
      }
    }

    throw new Error(`Too many concurrent requests for integration ${integrationId}`)
  }

  public async incrementConcurrentRequest(integrationId: string) {
    const key = this.getRequestKey(integrationId)
    await this.cache.increment(key, 1, this.maxLockTimeSeconds)
  }

  public async decrementConcurrentRequest(integrationId: string) {
    const key = this.getRequestKey(integrationId)
    await this.cache.decrement(key, 1, this.maxLockTimeSeconds)
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
