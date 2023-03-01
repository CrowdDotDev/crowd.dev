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
    url: `https://slack.com/api/users.profile.get`,
    params: {
      user: input.userId,
    },
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  try {
    const response = await axios(config)

    if (response.data.ok === true) {
      const profile = response.data.profile
      return {
        records: profile,
        nextPage: '',
      }
    }

    if (response.data.error === 'user_not_found' || response.data.error === 'account_inactive') {
      return {
        records: undefined,
        nextPage: '',
      }
    }

    throw new Error(`Slack API error ${response.data.error}!`)
  } catch (err) {
    const newErr = handleSlackError(err, config, input, logger)
    throw newErr
  }
}

export default getMembers
