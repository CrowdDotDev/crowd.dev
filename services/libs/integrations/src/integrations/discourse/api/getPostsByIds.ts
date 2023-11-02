import axios, { AxiosRequestConfig } from 'axios'
import { RateLimitError } from '@crowd/types'
import {
  DiscourseConnectionParams,
  DiscoursePostsByIdsResponse,
  DiscoursePostsByIdsInput,
} from '../types'
import { IProcessStreamContext } from '../../../types'

const serializeArrayToQueryString = (params: object) =>
  Object.entries(params)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((val) => `${encodeURIComponent(key)}[]=${encodeURIComponent(val)}`)
          .join('&')
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

// this methods returns ids of posts in a topic
// then we need to parse each topic individually (can be batched)
export const getDiscoursePostsByIds = async (
  params: DiscourseConnectionParams,
  input: DiscoursePostsByIdsInput,
  ctx: IProcessStreamContext,
): Promise<DiscoursePostsByIdsResponse> => {
  ctx.log.info({
    message: 'Fetching posts by ids from Discourse',
    params,
    input,
  })

  const queryParameters = {
    post_ids: input.post_ids,
  }

  const queryString = serializeArrayToQueryString(queryParameters)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `${params.forumHostname}/t/${input.topic_id}/posts.json?${queryString}`,
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
      throw new RateLimitError(5 * 60, 'discourse/getpostsbyids')
    }
    ctx.log.error({ err, params, input }, 'Error while getting posts by ids from Discourse ')
    throw err
  }
}
