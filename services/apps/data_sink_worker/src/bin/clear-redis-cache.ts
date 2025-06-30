import { getServiceLogger } from '@crowd/logging'
import { RedisCache, getRedisClient } from '@crowd/redis'

import { REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: redis-key')
  process.exit(1)
}

const redisKey = processArguments[0]

setImmediate(async () => {
  const redis = await getRedisClient(REDIS_CONFIG())
  const cache = new RedisCache(redisKey, redis, log)

  try {
    // delete redis key
    await cache.deleteAll()

    log.info({ redisKey }, 'Redis key deleted!')

    process.exit(0)
  } catch (err) {
    log.error('Failed to delete redis key!', err)
    process.exit(1)
  }
})
