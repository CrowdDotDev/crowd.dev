import axios from 'axios'
import { SlackChannels, SlackGetChannelsInput } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

async function getChannels(input: SlackGetChannelsInput, logger: Logger): Promise<SlackChannels> {
  await timeout(2000)

  try {
    const config = {
      method: 'get',
      url: 'https://slack.com/api/conversations.list?limit=100',
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }

    const response = await axios(config)
    const result: SlackChannels = response.data.channels

    return result
      .filter((c) => c.is_member)
      .map((c) => ({
        name: c.name,
        id: c.id,
      }))
  } catch (err) {
    if (err && err.response && err.response.status === 429 && err.response.headers['Retry-After']) {
      logger.warn('Slack API rate limit exceeded')
      const rateLimitResetSeconds = parseInt(err.response.headers['Retry-After'], 10)
      throw new RateLimitError(rateLimitResetSeconds, '/conversations.list')
    } else {
      logger.error({ err, input }, 'Error while getting channels from Slack')
      throw err
    }
  }
}

export default getChannels
