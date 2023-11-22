import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'
import type { DiscourseConnectionParams } from '../../types/discourseTypes'
import { DiscourseUserResponse, DisourseUserByUsernameInput } from '../../types/discourseTypes'

export const getDiscourseUserByUsername = async (
  params: DiscourseConnectionParams,
  input: DisourseUserByUsernameInput,
  logger: Logger,
): Promise<DiscourseUserResponse | undefined> => {
  logger.info({
    message: 'Fetching user by username from Discourse',
    params,
    input,
  })
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `${params.forumHostname}/u/${encodeURIComponent(input.username)}.json`,
    headers: {
      'Api-Key': params.apiKey,
      'Api-Username': params.apiUsername,
    },
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 429) {
      // wait 5 mins
      throw new RateLimitError(5 * 60, 'discourse/getuserbyusername')
    }

    if (err?.response?.status === 404) {
      return undefined
    }
    logger.error({ err, params, input }, 'Error while fetching user by username from Discourse ')
    throw err
  }
}
