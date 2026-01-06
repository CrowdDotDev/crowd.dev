import { MemberQueryCache } from '@crowd/data-access-layer/src/members/queryCache'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'

import { REDIS_CONFIG } from '@/conf'

const log = getServiceLogger()

setImmediate(async () => {
  try {
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const cache = new MemberQueryCache(redis)
    await cache.invalidateAll()
    log.info('Invalidated member query cache')
    process.exit(0)
  } catch (error) {
    log.error('Failed to invalidate member query cache', { error })
    process.exit(1)
  }
})
