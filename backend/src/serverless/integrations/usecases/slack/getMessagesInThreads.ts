import axios from 'axios'
import {
  SlackMessages,
  SlackParsedReponse,
  SlackGetMessagesInThreadsInput,
} from '../../types/slackTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getSlackMessagesInThreads')

async function getMessagesInThreads(
  input: SlackGetMessagesInThreadsInput,
): Promise<SlackParsedReponse> {
  try {
    const config = {
      method: 'get',
      url: `https://slack.com/api/conversations.replies?channel=${input.channelId}&cursor=${input.page}&limit=${input.perPage}&ts=${input.threadId}`,
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

export default getMessagesInThreads
