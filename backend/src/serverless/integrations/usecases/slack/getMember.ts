import axios from 'axios'
import { SlackGetMemberInput, SlackGetMemberOutput } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

async function getMembers(
  input: SlackGetMemberInput,
  logger: Logger,
): Promise<SlackGetMemberOutput> {
  await timeout(2000)

  try {
    const config = {
      method: 'get',
      url: `https://slack.com/api/users.info?user=${input.userId}`,
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }

    const response = await axios(config)
    const member = response.data.user
    const limit = 100
    const timeUntilReset = 0
    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records: member,
      nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    if (err && err.response && err.response.status === 429 && err.response.headers['Retry-After']) {
      logger.warn('Slack API rate limit exceeded')
      const rateLimitResetSeconds = parseInt(err.response.headers['Retry-After'], 10)
      throw new RateLimitError(rateLimitResetSeconds, '/users.info')
    } else {
      logger.error({ err, input }, 'Error while getting members from Slack')
      throw err
    }
  }
}

export default getMembers
