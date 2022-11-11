import axios from 'axios'
import {
  DiscordGetMembersInput,
  DiscordGetMembersOutput,
  DiscordMembers,
} from '../../types/discordTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getMembers')

async function getMembers(input: DiscordGetMembersInput): Promise<DiscordGetMembersOutput> {
  try {
    log.info({ input }, 'Getting members from Discord')
    let url = `https://discord.com/api/v10/guilds/${input.guildId}/members?limit=${input.perPage}`
    if (input.page !== undefined && input.page !== '') {
      url += `&after=${input.page}`
    }
    const config = {
      method: 'get',
      url,
      headers: {
        Authorization: input.token,
      },
    }

    const response = await axios(config)
    const records: DiscordMembers = response.data
    const limit = parseInt(response.headers['x-ratelimit-remaining'], 10)
    const timeUntilReset = parseInt(response.headers['x-ratelimit-reset-after'], 10)
    const nextPage = records.length > 0 ? (records[records.length - 1].id as string) : ''
    return {
      records,
      nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    if (err.response.status === 429) {
      log.warn(
        `Rate limit exceeded in Get Members. Wait value in header is ${err.response.headers['x-ratelimit-reset-after']}`,
      )
      return {
        records: [],
        nextPage: input.page,
        limit: 0,
        timeUntilReset: err.response.headers['x-ratelimit-reset-after'],
      }
    }
    log.error({ err, input }, 'Error while getting members from Discord')
    throw err
  }
}

export default getMembers
