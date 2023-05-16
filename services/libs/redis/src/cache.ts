import { ICache } from '@crowd/types'
import { Logger, LoggerBase } from '@crowd/logging'
import { RedisClient } from './types'

export class RedisCache extends LoggerBase implements ICache {
  private readonly prefixer: (key: string) => string

  private readonly prefixRegex: RegExp

  private readonly directory: string

  constructor(
    public readonly name: string,
    private readonly client: RedisClient,
    parentLog: Logger,
  ) {
    super(parentLog, { name })

    this.directory = `cache_${name}`
    this.prefixRegex = new RegExp(`^${this.directory}:`)

    this.prefixer = (key: string) => `${this.directory}:${key}`
  }

  public getDirectory(): string {
    return this.directory
  }

  async get(key: string): Promise<string> {
    const actualKey = this.prefixer(key)
    const value = await this.client.get(actualKey)
    return value
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const actualKey = this.prefixer(key)

    if (ttlSeconds !== undefined) {
      await this.client.setEx(actualKey, ttlSeconds, value)
    } else {
      await this.client.set(actualKey, value)
    }
  }

  delete(key: string): Promise<number> {
    const actualKey = this.prefixer(key)
    return this.client.del(actualKey)
  }
}
