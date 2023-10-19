import { IProcessStreamContext } from '../../../types'

const DISCORD_RATE_LIMIT = 100
const DISCORD_RATE_LIMIT_TIME = 1 // 1 second
const REDIS_KEY = 'discord-request-count'

export const getRateLimiter = (ctx: IProcessStreamContext) => {
  return ctx.getRateLimiter(DISCORD_RATE_LIMIT, DISCORD_RATE_LIMIT_TIME, REDIS_KEY)
}
