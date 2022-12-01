import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import {
  SlackGetMessagesInThreadsInput,
  SlackMessages,
  SlackParsedResponse,
} from '../../types/slackTypes'
import { handleSlackError } from './errorHandler'

async function getMessagesInThreads(
  input: SlackGetMessagesInThreadsInput,
  logger: Logger,
): Promise<SlackParsedResponse> {
  await timeout(2000)

  try {
    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://slack.com/api/conversations.replies`,
      params: {
        channel: input.channelId,
        ts: input.threadId,
      },
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }

    if (input.page !== undefined && input.page !== '') {
      config.params.cursor = input.page
    }

    if (input.perPage !== undefined && input.perPage > 0) {
      config.params.limit = input.perPage
    }

    const response = await axios(config)
    const records: SlackMessages = response.data.messages
    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records,
      nextPage,
    }
  } catch (err) {
    const newErr = handleSlackError(err, input, logger)
    throw newErr
  }
}

export default getMessagesInThreads
