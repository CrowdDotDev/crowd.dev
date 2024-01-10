import axios, { AxiosRequestConfig } from 'axios'
import { RateLimitError } from '@crowd/types'
import type {
  DiscourseConnectionParams,
  DiscourseUserResponse,
  DisourseUserByUsernameInput,
} from '../types'
import { IProcessStreamContext } from '../../../types'

// this methods returns ids of posts in a topic
// then we need to parse each topic individually (can be batched)
export const getDiscourseUserByUsername = async (
  params: DiscourseConnectionParams,
  input: DisourseUserByUsernameInput,
  ctx: IProcessStreamContext,
): Promise<DiscourseUserResponse | undefined> => {
  ctx.log.info({
    message: 'Fetching user by username from Discourse',
    params,
    input,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    ctx.log.error({ err, params, input }, 'Error while fetching user by username from Discourse ')
    throw err
  }
}
