import axios from 'axios'
import { SlackMessages, SlackParsedReponse, SlackGetMessagesInput } from '../../types/slackTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getSlackMessages')

async function getMessages(input: SlackGetMessagesInput): Promise<SlackParsedReponse> {
  try {
    const config = {
      method: 'get',
      url: `https://slack.com/api/conversations.history?channel=${input.channelId}&cursor=${input.page}&limit=${input.perPage}`,
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }

    const response = await axios(config)
    const records: SlackMessages = response.data.messages

    const limit = 100
    const timeUntilReset = 0
    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records,
      nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    log.error({ err, input }, 'Error while getting messages from Slack')
    throw err
  }
}

export default getMessages
