import { getServiceLogger } from '../utils/logging'
import { createRedisClient } from '../utils/redis'

const log = getServiceLogger()

export async function redisMiddleware(req, res, next) {
  try {
    const redis = await createRedisClient(true)
    if ((await redis.ping()) !== 'PONG') {
      throw new Error(`Can't ping redis`)
    }
    req.redis = redis
  } catch (error) {
    log.error(error, 'Error connecting to redis!')
  } finally {
    next()
  }
}
