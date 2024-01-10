import { IProcessStreamContext } from '../../../types'
import { RateLimitError } from '@crowd/types'

const DISCORD_RATE_LIMIT = 100000
const DISCORD_RATE_LIMIT_TIME = 100 // 100 seconds
const REDIS_KEY = 'discord-ratelimits-requests-count'

export const getRateLimiter = (ctx: IProcessStreamContext) => {
  return ctx.getRateLimiter(DISCORD_RATE_LIMIT, DISCORD_RATE_LIMIT_TIME, REDIS_KEY)
}

export const retryWrapper = async (maxRetries, fn) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn()
      return result
    } catch (err) {
      if (err instanceof RateLimitError && i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, (i + 1) * 1000))
        continue
      }
      throw err
    }
  }
}
