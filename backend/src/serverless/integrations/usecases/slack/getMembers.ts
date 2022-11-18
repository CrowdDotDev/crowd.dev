import axios from 'axios'
import { SlackGetMembersInput, SlackGetMembersOutput, SlackMembers } from '../../types/slackTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'

async function getMembers(
  input: SlackGetMembersInput,
  logger: Logger,
): Promise<SlackGetMembersOutput> {
  await timeout(1000)

  try {
    const config = {
      method: 'get',
      url: `https://slack.com/api/users.list?cursor=${input.page}&limit=${input.perPage}`,
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    }

    const response = await axios(config)
    const records: SlackMembers = response.data.members
    const limit = 100
    const timeUntilReset = 0
    const nextPage = response.data.response_metadata?.next_cursor || ''
    return {
      records,
      nextPage,
      limit,
      timeUntilReset,
    }
  } catch (err) {
    logger.error({ err, input }, 'Error while getting members from Slack')
    throw err
  }
}

export default getMembers
