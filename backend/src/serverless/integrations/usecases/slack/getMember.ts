import axios from 'axios'
import { SlackGetMemberInput, SlackGetMemberOutput } from '../../types/slackTypes'
import { createServiceChildLogger } from '../../../../utils/logging'

const log = createServiceChildLogger('getSlackMembers')

async function getMembers(input: SlackGetMemberInput): Promise<SlackGetMemberOutput> {
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
    log.error({ err, input }, 'Error while getting members from Slack')
    throw err
  }
}

export default getMembers
