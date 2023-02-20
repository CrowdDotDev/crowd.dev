import axios from 'axios'
import { DiscordApiChannel, DiscordGetChannelsInput } from '../../types/discordTypes'
import { Logger } from '../../../../utils/logging'

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
