import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { timeout } from '@crowd/common'
import { SlackGetMessagesInput, SlackMessages, SlackParsedResponse } from '../../types/slackTypes'
import { handleSlackError } from './errorHandler'

async function getMessages(
  input: SlackGetMessagesInput,
  logger: Logger,
): Promise<SlackParsedResponse> {
  await timeout(2000)

  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://slack.com/api/conversations.history`,
    params: {
      channel: input.channelId,
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

  try {
    const response = await axios(config)
    const records: SlackMessages = response.data.messages

    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records,
      nextPage,
    }
  } catch (err) {
    const newErr = handleSlackError(err, config, input, logger)
    throw newErr
  }
}

export default getMessages
