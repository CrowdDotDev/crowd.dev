import axios, { AxiosRequestConfig } from 'axios'
import { timeout } from '@crowd/common'
import { SlackGetChannelsInput, SlackTeam } from '../types'
import { handleSlackError } from './errorHandler'
import { IProcessStreamContext } from '@/types'

async function getChannels(
  input: SlackGetChannelsInput,
  ctx: IProcessStreamContext,
): Promise<SlackTeam> {
  await timeout(2000)

  const logger = ctx.log

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
