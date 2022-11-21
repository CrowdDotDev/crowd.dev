import { getServiceLogger } from '../utils/logging'
import { RedisClient } from '../utils/redis'

const log = getServiceLogger()

export function redisMiddleware(redis: RedisClient) {
  return async (req, res, next) => {
    try {
      if ((await redis.ping()) !== 'PONG') {
        throw new Error(`Can't ping redis.`)
      }
      req.redis = redis
    } catch (error) {
      log.error(error, 'Error connecting to redis!')
    } finally {
      next()
    }
  }
}
