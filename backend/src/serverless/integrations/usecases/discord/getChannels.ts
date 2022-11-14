import axios from 'axios'
import {
  DiscordChannel,
  DiscordChannels,
  DiscordGetChannelsInput,
  DiscordGetMessagesInput,
} from '../../types/discordTypes'
import getMessages from './getMessages'
import { timeout } from '../../../../utils/timing'
import { Logger } from '../../../../utils/logging'

/**
 * Try if a channel is readable
 * @param accessToken Discord bot token
 * @param channel Channel ID
 * @returns Limit if the channel is readable, false otherwise
 */
async function tryChannel(input: DiscordGetMessagesInput, logger: Logger): Promise<any> {
  try {
    const result = await getMessages(input, logger, false)
    if (result.limit) {
      return result.limit
    }
    return false
  } catch (err) {
    return false
  }
}

async function getChannels(
  input: DiscordGetChannelsInput,
  logger: Logger,
  tryChannels = true,
): Promise<DiscordChannels> {
  try {
    const config = {
      method: 'get',
      url: `https://discord.com/api/v10/guilds/${input.guildId}/channels?`,
      headers: {
        Authorization: input.token,
      },
    }

    const response = await axios(config)
    const result: DiscordChannels = response.data

    if (tryChannels) {
      const out: DiscordChannels = []
      for (const channel of result) {
        const limit = await tryChannel(
          {
            channelId: channel.id,
            token: input.token,
            perPage: 1,
            page: undefined,
          },
          logger,
        )
        if (limit) {
          const toOut: DiscordChannel = {
            name: channel.name,
            id: channel.id,
          }
          out.push(toOut)
          if (limit <= 1 && limit !== false) {
            await timeout(5 * 1000)
          }
        }
      }
      return out
    }

    return result.map((c) => ({
      name: c.name,
      id: c.id,
    }))
  } catch (err) {
    logger.error({ err, input }, 'Error while getting channels from Discord')
    throw err
  }
}

export default getChannels
