import axios from 'axios'
import { Logger } from '@crowd/logging'
import { DiscordApiChannel, DiscordGetChannelsInput } from '../../types/discordTypes'

async function getThreads(
  input: DiscordGetChannelsInput,
  logger: Logger,
): Promise<DiscordApiChannel[]> {
  try {
    const config = {
      method: 'get',
      url: `https://discord.com/api/v10/guilds/${input.guildId}/threads/active?`,
      headers: {
        Authorization: input.token,
      },
    }

    const response = await axios(config)
    return response.data.threads
  } catch (err) {
    logger.error({ err, input }, 'Error while getting threads from Discord')
    throw err
  }
}

export default getThreads
