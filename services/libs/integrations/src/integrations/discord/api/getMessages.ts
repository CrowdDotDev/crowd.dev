import axios from 'axios'
import { DiscordApiMessage, DiscordParsedReponse, DiscordGetMessagesInput } from '../types'
import { IProcessStreamContext } from '../../../types'
import { getRateLimiter } from './handleRateLimit'
import { handleDiscordError } from './errorHandler'

async function getMessages(
  input: DiscordGetMessagesInput,
  ctx: IProcessStreamContext,
  showErrors = true,
): Promise<DiscordParsedReponse> {
  const rateLimiter = getRateLimiter(ctx)

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

  try {
    await rateLimiter.checkRateLimit('getMessages')
    await rateLimiter.incrementRateLimit()
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
    if (!showErrors) {
      return {
        records: [],
        nextPage: '',
        limit: 0,
        timeUntilReset: 0,
      }
    }
    const newErr = handleDiscordError(err, config, { input }, ctx)
    if (newErr) {
      throw newErr
    }
  }
}

export default getMessages
