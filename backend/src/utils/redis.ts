import { createClient, RedisClientType, RedisDefaultModules } from 'redis'
import { IS_DEV_ENV, IS_TEST_ENV, REDIS_CONFIG } from '../config'
import { createServiceChildLogger } from './logging'
import { timeout } from './timing'
import { LoggingBase } from '../services/loggingBase'

const log = createServiceChildLogger('redis')

export type RedisClient = RedisClientType<RedisDefaultModules>

let redisClientInstance: RedisClient

export const createRedisClient = async (exitOnError?: boolean): Promise<RedisClient> => {
  if (REDIS_CONFIG.host) {
    if (redisClientInstance) return redisClientInstance
    const host = REDIS_CONFIG.host
    const port = REDIS_CONFIG.port

    log.info(`Creating new Redis client instance for Redis Server: ${host}:${port}!`)

    redisClientInstance = createClient({
      url: `redis://${REDIS_CONFIG.username}:${REDIS_CONFIG.password}@${host}:${port}`,
    }) as RedisClient

    if (exitOnError) {
      redisClientInstance.on('error', async (err) => {
        log.error(err, { host, port }, 'Redis client error!')

        if (
          [
            'ECONNRESET',
            'ECONNREFUSED',
            'UNCERTAIN_STATE',
            'NR_CLOSED',
            'CONNECTION_BROKEN',
            'NOAUTH',
          ].includes(err.code)
        ) {
          log.fatal(err, { host, port }, 'Fatal redis client connection error - exiting process!')
          await timeout(100)
          process.nextTick(() => process.exit())
        }
      })
    }

    await redisClientInstance.connect()
    await redisClientInstance.ping()
    log.info('Redis client connected!')

    return redisClientInstance
  }

  throw new Error('Redis client not configured!')
}

export const stopClient = async (client: RedisClient): Promise<void> => client.quit()

export const flushRedisContent = async (client: RedisClient): Promise<void> => {
  if (IS_DEV_ENV || IS_TEST_ENV) {
    log.warn('Flushing and entire redis!')
    await client.flushAll()
  }

  log.warn('Not development or test environment - nothing will be flushed!')
}

export class RedisCache extends LoggingBase {
  private readonly prefixer: (key: string) => string

  private readonly prefixRegex: RegExp

  private readonly directory: string

  public constructor(public readonly name: string, private readonly redisClient: RedisClient) {
    super()

    this.directory = `cache_${name}`
    this.prefixRegex = new RegExp(`^${this.directory}:`)

    this.prefixer = (key: string) => `${this.directory}:${key}`
  }

  public getDirectory(): string {
    return this.directory
  }

  public async delete(key: string): Promise<number> {
    const actualKey = this.prefixer(key)
    return this.redisClient.del(actualKey)
  }

  private async deleteByPattern(pattern: string): Promise<number> {
    const script = `
local delpattern = ARGV[1]
local limit = 5000
local count = 0
local valuelist = redis.call('keys', delpattern)
if valuelist then
  if #valuelist ~= 0 then
    for i=1,#valuelist,limit do
      local tempCount = redis.call('del', unpack(valuelist, i, math.min(i+limit-1, #valuelist)))
      count = count + tempCount
    end
  end
end
return count`

    const result = await this.redisClient.eval(script, {
      arguments: [pattern],
    })

    return result as number
  }

  public deleteByKeyPattern(keyPattern: string): Promise<number> {
    const actualPattern = this.prefixer(keyPattern)
    return this.deleteByPattern(actualPattern)
  }

  public deleteAll(): Promise<number> {
    return this.deleteByPattern(this.prefixer('*'))
  }

  public async getKeys(pattern: string, removeCacheName: boolean = true): Promise<string[]> {
    const actualPattern = this.prefixer(pattern)
    const keys = await this.redisClient.keys(actualPattern)

    if (removeCacheName) {
      return keys.map((k) => k.replace(this.prefixRegex, ''))
    }

    return keys
  }

  public getAllValues(): Promise<Map<string, string>> {
    return this.getValueByKeyPattern('*')
  }

  public async setValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const actualKey = this.prefixer(key)

    if (ttlSeconds !== undefined) {
      await this.redisClient.setEx(actualKey, ttlSeconds, value)
    } else {
      await this.redisClient.set(actualKey, value)
    }
  }

  public setValueIfNotExistsAlready(key: string, value: string): Promise<boolean> {
    const actualKey = this.prefixer(key)
    return this.redisClient.setNX(actualKey, value)
  }

  public async getValue(key: string): Promise<string | null> {
    const actualKey = this.prefixer(key)
    const value = await this.redisClient.get(actualKey)
    return value
  }

  public async getOrAdd(
    key: string,
    provider: (key: string) => Promise<string> | string,
    ttlSeconds?: number,
  ): Promise<string> {
    const value = await this.getValue(key)
    if (value !== null) {
      return value
    }

    const generatedValue = await provider(key)
    await this.setValue(key, value, ttlSeconds)
    return generatedValue
  }

  public async getValueByKeyPattern(
    keyPattern: string,
    removeCacheName: boolean = true,
  ): Promise<Map<string, string>> {
    const actualPattern = this.prefixer(keyPattern)
    const script = `
local keypattern = ARGV[1]
local limit = 5000

local valuelist = redis.call('keys', keypattern)
local results = {}

results['keys'] = {}
results['values'] = {}

local values = results['values']

if valuelist then
  if #valuelist ~= 0 then
    results['keys'] = valuelist
    for i=1,#valuelist,limit do
      local tmp = redis.call('mget', unpack(valuelist, i, math.min(i+limit-1, #valuelist)))
      for j=1, #tmp do
        values[#values+1] = tmp[j]
      end
    end
  end
end
return cjson.encode(results)`

    const results = await this.redisClient.eval(script, {
      arguments: [actualPattern],
    })

    const json: { keys: string[]; values: string[] } = JSON.parse(results as string)
    const map = new Map<string, string>()
    if (json.keys !== undefined && Array.isArray(json.keys)) {
      json.keys.forEach((key, index) => {
        if (removeCacheName) {
          map.set(key.replace(this.prefixRegex, ''), json.values[index])
        } else {
          map.set(key, json.values[index])
        }
      })
    }

    return map
  }
}
