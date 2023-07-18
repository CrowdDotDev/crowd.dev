import axios from 'axios'
import { timeout } from '@crowd/common'
import { DiscordApiChannel, DiscordGetChannelsInput, DiscordGetMessagesInput } from '../types'
import getMessages from './getMessages'
import { IProcessStreamContext } from '@/types'

/**
 * Try if a channel is readable
 * @param input getMessages input parameters
 * @param logger logger
 * @returns Limit if the channel is readable, false otherwise
 */
async function tryChannel(
  input: DiscordGetMessagesInput,
  ctx: IProcessStreamContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    const result = await getMessages(input, ctx, false)
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
  ctx: IProcessStreamContext,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = response.data

    if (tryChannels) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out: any[] = []
      for (const channel of result) {
        const limit = await tryChannel(
          {
            channelId: channel.id,
            token: input.token,
            perPage: 1,
            page: undefined,
          },
          ctx,
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
    ctx.log.error({ err, input }, 'Error while getting channels from Discord')
    throw err
  }
}

export default getChannels
