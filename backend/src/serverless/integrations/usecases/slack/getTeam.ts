import axios from 'axios'
import { SlackTeam, SlackGetChannelsInput } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'

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
    const result: SlackTeam = response.data.team

    return result
  } catch (err) {
    logger.error({ err, input }, 'Error while getting channels from Slack')
    throw err
  }
}

export default getChannels
