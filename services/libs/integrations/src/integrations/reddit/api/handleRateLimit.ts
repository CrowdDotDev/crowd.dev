import { IProcessStreamContext } from '@/types'
import { RateLimiter } from '@crowd/redis'

const REDDIT_RATE_LIMIT = 100
const REDDIT_RATE_LIMIT_TIME = 60
const REDIS_KEY = 'reddit-request-count'

export const getRateLimiter = (ctx: IProcessStreamContext) => {
  return new RateLimiter(ctx.globalCache, REDDIT_RATE_LIMIT, REDDIT_RATE_LIMIT_TIME, REDIS_KEY)
}
