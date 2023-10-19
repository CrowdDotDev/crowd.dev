import { IProcessStreamContext } from '../../../types'

const DISCORD_RATE_LIMIT = 10000
const DISCORD_RATE_LIMIT_TIME = 100 // 100 seconds
const REDIS_KEY = 'discord-ratelimits-requests-count'

export const getRateLimiter = (ctx: IProcessStreamContext) => {
  return ctx.getRateLimiter(DISCORD_RATE_LIMIT, DISCORD_RATE_LIMIT_TIME, REDIS_KEY)
}
