import axios from 'axios'
import {
  DiscordMessages,
  DiscordParsedReponse,
  DiscordGetMessagesInput,
} from '../../types/discordTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getDiscordMessages')

async function getMessages(input: DiscordGetMessagesInput): Promise<DiscordParsedReponse> {
  try {
    log.info({ input }, 'Getting messages from Discord')
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
    const records: DiscordMessages = response.data

    // TODO No-SF, do we need this?
    // if ('error' in result) {
    //   if (result.error.statusCode === 500) {
    //     log.error(result.error, `Error in messages: ${result.error.properties.detail}`)
    //     return {
    //       records: [],
    //       nextPage: page,
    //       limit: 0,
    //       timeUntilReset: 180,
    //     }
    //   }
    // }

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
      log.warn(
        `Rate limit exceeded in Get Messages. Wait value in header is ${err.response.headers['x-ratelimit-reset-after']}`,
      )
      return {
        records: [],
        nextPage: input.page,
        limit: 0,
        timeUntilReset: err.response.headers['x-ratelimit-reset-after'],
      }
    }
    log.error({ err, input }, 'Error while getting messages from Discord')
    throw err
  }
}

export default getMessages
