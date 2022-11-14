import axios from 'axios'
import { DiscordChannels, DiscordGetChannelsInput } from '../../types/discordTypes'
import { Logger } from '../../../../utils/logging'

async function getThreads(
  input: DiscordGetChannelsInput,
  logger: Logger,
): Promise<DiscordChannels> {
  try {
    const config = {
      method: 'get',
      url: `https://discord.com/api/v10/guilds/${input.guildId}/threads/active?`,
      headers: {
        Authorization: input.token,
      },
    }

    const response = await axios(config)
    const result: DiscordChannels = response.data.threads

    return result.map((c) => ({
      name: c.name,
      id: c.id,
      thread: true,
    }))
  } catch (err) {
    logger.error({ err, input }, 'Error while getting threads from Discord')
    throw err
  }
}

export default getThreads
