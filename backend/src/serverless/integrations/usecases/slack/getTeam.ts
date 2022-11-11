import axios from 'axios'
import { SlackTeam, SlackGetChannelsInput } from '../../types/slackTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getSlackChannels')

async function getChannels(input: SlackGetChannelsInput): Promise<SlackTeam> {
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
    log.error({ err, input }, 'Error while getting channels from Slack')
    throw err
  }
}

export default getChannels
