import axios from 'axios'
import { SlackChannels, SlackGetChannelsInput } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'

async function getChannels(input: SlackGetChannelsInput, logger: Logger): Promise<SlackChannels> {
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
    logger.error({ err, input }, 'Error while getting channels from Slack')
    throw err
  }
}

export default getChannels
