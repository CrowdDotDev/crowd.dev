import { ICache } from '@crowd/types'

export class RedisSemaphore {
  private readonly key: string
  private readonly maxConcurrent: number
  private readonly cache: ICache
  private readonly timeout: number

  constructor({
    integrationId,
    apiCallType,
    maxConcurrent,
    cache,
    timeout = 60000,
  }: {
    integrationId: string
    apiCallType: string
    maxConcurrent: number
    cache: ICache
    timeout?: number
  }) {
    this.key = `groupsio-semaphore:${integrationId}:${apiCallType}`
    this.maxConcurrent = maxConcurrent
    this.cache = cache
    this.timeout = timeout
  }

  async acquire(): Promise<boolean> {
    const startTime = Date.now()
    while (Date.now() - startTime < this.timeout) {
      const current = await this.cache.get(this.key)
      const currentValue = current ? parseInt(current, 10) : 0

      if (currentValue < this.maxConcurrent) {
        await this.cache.increment(this.key)
        return true
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`Failed to acquire lock within timeout period for ${this.key}`)
  }

  async release(): Promise<void> {
    const current = await this.cache.get(this.key)
    if (current && parseInt(current, 10) > 0) {
      await this.cache.decrement(this.key)
    }
  }
}
