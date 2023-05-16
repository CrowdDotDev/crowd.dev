import { IS_DEV_ENV, IS_TEST_ENV, timeout } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { IRedisConfiguration, RedisClient } from './types'
import { createClient } from 'redis'

const log = getServiceChildLogger('redis')

export const getRedisClient = async (
  config: IRedisConfiguration,
  exitOnError?: boolean,
): Promise<RedisClient> => {
  if (config.host) {
    const host = config.host
    const port = config.port

    log.info(`Creating new Redis client instance for Redis Server: ${host}:${port}!`)

    const instance = createClient({
      url: `redis://${config.username}:${config.password}@${host}:${port}`,
    }) as RedisClient

    if (exitOnError) {
      instance.on('error', async (err) => {
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

    await instance.connect()
    await instance.ping()
    log.info('Redis client connected!')

    return instance
  }

  throw new Error('Redis client not configured!')
}

export const stopClient = async (client: RedisClient): Promise<string> => client.quit()

export const flushRedisContent = async (client: RedisClient): Promise<void> => {
  if (IS_DEV_ENV || IS_TEST_ENV) {
    log.warn('Flushing and entire redis!')
    await client.flushAll()
  }

  log.warn('Not development or test environment - nothing will be flushed!')
}
