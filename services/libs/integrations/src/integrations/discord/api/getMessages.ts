import axios from 'axios'
import { DiscordApiMessage, DiscordParsedReponse, DiscordGetMessagesInput } from '../types'
import { IProcessStreamContext } from '../../../types'

async function getMessages(
  input: DiscordGetMessagesInput,
  ctx: IProcessStreamContext,
  showError = true,
): Promise<DiscordParsedReponse> {
  try {
    let url = `https://discord.com/api/v10/channels/${input.channelId}/messages?limit=${input.perPage}`
    if (input.page !== undefined && input.page !== '') {
      url += `&before=${input.page}`
    }
    const config = {
      method: 'get',
      url,
      headers: {
        Authorization: input.token,
      },
    }

    const response = await axios(config)
    const records: DiscordApiMessage[] = response.data

    const limit = parseInt(response.headers['x-ratelimit-remaining'], 10)
    const timeUntilReset = parseInt(response.headers['x-ratelimit-reset-after'], 10)
    const nextPage = records.length > 0 ? records[records.length - 1].id : ''
    return {
      records,
      nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    if (err.response.status === 429) {
      ctx.log.warn(
        `Rate limit exceeded in Get Messages. Wait value in header is ${err.response.headers['x-ratelimit-reset-after']}`,
      )
      return {
        records: [],
        nextPage: input.page,
        limit: 0,
        timeUntilReset: err.response.headers['x-ratelimit-reset-after'],
      }
    }
    if (!showError) {
      return {
        records: [],
        nextPage: '',
        limit: 0,
        timeUntilReset: 0,
      }
    }
    ctx.log.error({ err, input }, 'Error while getting messages from Discord')
    throw err
  }
}

export default getMessages
