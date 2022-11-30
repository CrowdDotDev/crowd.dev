import axios from 'axios'
import { SlackGetChannelsInput, SlackTeam } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

async function getChannels(input: SlackGetChannelsInput, logger: Logger): Promise<SlackTeam> {
  await timeout(2000)

  try {
    const config = {
      method: 'get',
      url: 'https://slack.com/api/team.info',
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }

    const response = await axios(config)
    return response.data.team
  } catch (err) {
    if (err && err.response && err.response.status === 429 && err.response.headers['Retry-After']) {
      logger.warn('Slack API rate limit exceeded')
      const rateLimitResetSeconds = parseInt(err.response.headers['Retry-After'], 10)
      throw new RateLimitError(rateLimitResetSeconds, '/team.info')
    } else {
      logger.error({ err, input }, 'Error while getting channels from Slack')
      throw err
    }
  }
}

export default getChannels
