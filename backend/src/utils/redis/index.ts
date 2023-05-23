import { createClient, RedisClientType, RedisDefaultModules } from 'redis'
import { createServiceChildLogger } from '../logging'
import { IS_DEV_ENV, IS_TEST_ENV, REDIS_CONFIG } from '../../conf'
import { timeout } from '../timing'

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

export interface IRedisPubSubPair {
  pubClient: RedisClient
  subClient: RedisClient
}

let redisPubSubPair: IRedisPubSubPair
export const createRedisPubSubPair = async (
  forceNew: boolean = false,
): Promise<IRedisPubSubPair> => {
  if (REDIS_CONFIG.host) {
    if (redisPubSubPair && !forceNew) return redisPubSubPair

    const host = REDIS_CONFIG.host
    const port = REDIS_CONFIG.port

    log.info(`Creating new Redis pub/sub client instances for Redis Server: ${host}:${port}!`)

    const pubClient = createClient({
      url: `redis://${REDIS_CONFIG.username}:${REDIS_CONFIG.password}@${host}:${port}`,
    }) as RedisClient
    const subClient = pubClient.duplicate() as RedisClient

    await pubClient.connect()
    await pubClient.ping()
    await subClient.connect()
    await subClient.ping()

    const newPair = {
      pubClient,
      subClient,
    }

    if (!forceNew) {
      redisPubSubPair = newPair
    }

    return newPair
  }

  throw new Error('Redis client not configured!')
}

export const stopPubSubPair = async (pair: IRedisPubSubPair): Promise<void> => {
  await stopClient(pair.pubClient)
  await stopClient(pair.subClient)
}

export interface IRedisPubSubEmitter {
  emit(channel: string, data: any)
}

export interface IRedisPubSubReceiver {
  subscribe(channel: string, listener: (data: any) => Promise<void>): string
  unsubscribe(id: string)
}

export interface IRedisPubSubBus extends IRedisPubSubEmitter, IRedisPubSubReceiver {}
