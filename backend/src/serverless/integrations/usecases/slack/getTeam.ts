import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import { SlackGetChannelsInput, SlackTeam } from '../../types/slackTypes'
import { handleSlackError } from './errorHandler'

async function getChannels(input: SlackGetChannelsInput, logger: Logger): Promise<SlackTeam> {
  await timeout(2000)

  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: 'https://slack.com/api/team.info',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  try {
    const response = await axios(config)
    return response.data.team
  } catch (err) {
    const newErr = handleSlackError(err, config, input, logger)
    throw newErr
  }
}

export default getChannels
