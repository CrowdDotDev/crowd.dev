import { getRedisClient } from '@crowd/redis'
import { REDIS_CONFIG } from '../conf'
import { timeout } from '@crowd/common'

setImmediate(async () => {
  const redis = await getRedisClient(REDIS_CONFIG())

  let i = 0

  const id = 'test_redis_connection'
  while (true) {
    const key = await redis.get(id)

    if (!key) {
      console.log(i, 'setting the key with 10 second expiration')
      await redis.setEx(id, 10, '1')
    } else {
      console.log(i, 'key is there already')
    }

    await timeout(500)
    i++
  }
})
