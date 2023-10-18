import axios from 'axios'
import { DiscordApiChannel, DiscordGetChannelsInput } from '../types'
import { IProcessStreamContext } from '../../../types'
import { getRateLimiter } from './handleRateLimit'
import { handleDiscordError } from './errorHandler'

async function getThreads(
  input: DiscordGetChannelsInput,
  ctx: IProcessStreamContext,
): Promise<DiscordApiChannel[]> {
  const rateLimiter = getRateLimiter(ctx)
  const config = {
    method: 'get',
    url: `https://discord.com/api/v10/guilds/${input.guildId}/threads/active?`,
    headers: {
      Authorization: input.token,
    },
  }
  try {
    await rateLimiter.checkRateLimit('getThreads')
    await rateLimiter.incrementRateLimit()
    const response = await axios(config)
    return response.data.threads
  } catch (err) {
    const newErr = handleDiscordError(err, config, { input }, ctx)
    throw newErr
  }
}

export default getThreads
