import axios from 'axios'
import { SlackMessages, SlackParsedResponse, SlackGetMessagesInput } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

async function getMessages(
  input: SlackGetMessagesInput,
  logger: Logger,
): Promise<SlackParsedResponse> {
  await timeout(2000)

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

    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records,
      nextPage,
    }
  } catch (err) {
    if (err && err.response && err.response.status === 429 && err.response.headers['Retry-After']) {
      logger.warn('Slack API rate limit exceeded')
      const rateLimitResetSeconds = parseInt(err.response.headers['Retry-After'], 10)
      throw new RateLimitError(rateLimitResetSeconds, '/conversation.history')
    } else {
      logger.error({ err, input }, 'Error while getting messages from Slack')
      throw err
    }
  }
}

export default getMessages
