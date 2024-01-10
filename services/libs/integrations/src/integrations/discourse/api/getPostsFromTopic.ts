import axios, { AxiosRequestConfig } from 'axios'
import { RateLimitError } from '@crowd/types'
import {
  DiscourseConnectionParams,
  DiscoursePostsFromTopicResponse,
  DiscoursePostsInput,
} from '../types'
import { IProcessStreamContext } from '../../../types'

// this methods returns ids of posts in a topic
// then we need to parse each topic individually (can be batched)
export const getDiscoursePostsFromTopic = async (
  params: DiscourseConnectionParams,
  input: DiscoursePostsInput,
  ctx: IProcessStreamContext,
): Promise<DiscoursePostsFromTopicResponse> => {
  ctx.log.info({
    message: 'Fetching posts from topic from Discourse',
    params,
    input,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `${params.forumHostname}/t/${input.topic_slug}/${input.topic_id}.json`,
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
      throw new RateLimitError(5 * 60, 'discourse/getpostsfromtopic')
    }
    ctx.log.error({ err, params, input }, 'Error while getting posts from topic from Discourse ')
    throw err
  }
}
