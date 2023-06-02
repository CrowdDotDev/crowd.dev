import axios from 'axios'
import { timeout } from '@crowd/common'
import { Logger } from '@crowd/logging'
import {
  DiscordApiChannel,
  DiscordGetChannelsInput,
  DiscordGetMessagesInput,
} from '../../types/discordTypes'
import getMessages from './getMessages'

/**
 * Try if a channel is readable
 * @param input getMessages input parameters
 * @param logger logger
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
): Promise<DiscordApiChannel[]> {
  try {
    const config = {
      method: 'get',
      url: `https://discord.com/api/v10/guilds/${input.guildId}/channels?`,
      headers: {
        Authorization: input.token,
      },
    }

    const response = await axios(config)
    const result: any = response.data

    if (tryChannels) {
      const out: any[] = []
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
          out.push(channel)
          if (limit <= 1 && limit !== false) {
            await timeout(5 * 1000)
          }
        }
      }
      return out
    }

    return result
  } catch (err) {
    logger.error({ err, input }, 'Error while getting channels from Discord')
    throw err
  }
}

export default getChannels
