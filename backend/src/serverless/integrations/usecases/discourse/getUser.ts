import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'
import type { DiscourseConnectionParams } from '../../types/discourseTypes'
import { DiscourseUserResponse, DisourseUserByUsernameInput } from '../../types/discourseTypes'

// this methods returns ids of posts in a topic
// then we need to parse each topic individually (can be batched)
export const getDiscourseUserByUsername = async (
  params: DiscourseConnectionParams,
  input: DisourseUserByUsernameInput,
  logger: Logger,
): Promise<DiscourseUserResponse> => {
  logger.info({
    message: 'Fetching user by username from Discourse',
    params,
    input,
  })
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `${params.forumHostname}/u/${input.username}.json`,
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
    logger.error({ err, params, input }, 'Error while fetching user by username from Discourse ')
    throw err
  }
}
