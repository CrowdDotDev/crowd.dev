import axios from 'axios'
import { DiscordApiChannel, DiscordGetChannelsInput } from '../types'
import { IProcessStreamContext } from '../../../types'

async function getThreads(
  input: DiscordGetChannelsInput,
  ctx: IProcessStreamContext,
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
    ctx.log.error({ err, input }, 'Error while getting threads from Discord')
    throw err
  }
}

export default getThreads
