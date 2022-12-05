import axios, { AxiosRequestConfig } from 'axios'
import { SlackGetMemberInput, SlackGetMemberOutput } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { handleSlackError } from './errorHandler'

async function getMembers(
  input: SlackGetMemberInput,
  logger: Logger,
): Promise<SlackGetMemberOutput> {
  await timeout(2000)

  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://slack.com/api/users.info`,
    params: {
      user: input.userId,
    },
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  try {
    const response = await axios(config)
    const member = response.data.user
    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records: member,
      nextPage,
    }
  } catch (err) {
    const newErr = handleSlackError(err, config, input, logger)
    throw newErr
  }
}

export default getMembers
