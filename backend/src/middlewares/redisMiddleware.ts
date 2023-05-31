import { RedisClient } from '@crowd/redis'

export function redisMiddleware(redis: RedisClient) {
  return async (req, res, next) => {
    req.redis = redis
    next()
  }
}
