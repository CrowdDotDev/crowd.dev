import axios, { AxiosRequestConfig } from 'axios'
import { timeout } from '@crowd/common'
import { handleSlackError } from './errorHandler'
import { SlackChannels, SlackGetChannelsInput } from '../types'
import { IProcessStreamContext } from '@/types'

async function getChannels(input: SlackGetChannelsInput, ctx: IProcessStreamContext) {
  await timeout(2000)

  const logger = ctx.log

  const config: AxiosRequestConfig = {
    method: 'get',
    url: 'https://slack.com/api/conversations.list',
    params: {
      limit: 100,
    },
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  }

  try {
    const response = await axios(config)
    const result: SlackChannels = response.data.channels

    return result
      .filter((c) => c.is_member)
      .map((c) => ({
        name: c.name,
        id: c.id,
        general: c.is_general,
      }))
  } catch (err) {
    const newErr = handleSlackError(err, config, input, logger)
    throw newErr
  }
}

export default getChannels
