import { ICache, IRateLimiter, RateLimitError } from '@crowd/types'

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
