import { getServiceChildLogger } from '@crowd/logging'

import { RedisCache } from '../cache'
import { REDIS_CONFIG, getRedisClient } from '../client'

const log = getServiceChildLogger('clear-cache')

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: cacheNames (comma-separated)')
  process.exit(1)
}

const cacheNames = processArguments[0].split(',')

setImmediate(async () => {
  const client = await getRedisClient(REDIS_CONFIG(), true)

  for (const cacheName of cacheNames) {
    log.warn(`Clearing cache '${cacheName}'!`)
    const cache = new RedisCache(cacheName, client, log)
    await cache.deleteAll()
  }

  process.exit(0)
})
