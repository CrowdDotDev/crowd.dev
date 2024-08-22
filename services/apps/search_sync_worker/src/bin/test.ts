import { getRedisClient } from '@crowd/redis'
import { REDIS_CONFIG } from '../conf'

setImmediate(async () => {
  const redis = await getRedisClient(REDIS_CONFIG())

  const id = 'test_redis_connection'
  while (true) {
    const key = await redis.get(id)

    if (!key) {
      console.log('setting the key with 10 second expiration')
      await redis.setEx(id, 10, '1')
    } else {
      console.log('key is there already')
    }
  }
})
