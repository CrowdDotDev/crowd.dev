import axios, { AxiosRequestConfig } from 'axios'
import type { DiscourseConnectionParams } from '../../types/discourseTypes'
import { Logger } from '../../../../utils/logging'
import { DiscoursePostsFromTopicResponse, DiscoursePostsInput } from '../../types/discourseTypes'

// this methods returns ids of posts in a topic
// then we need to parse each topic individually (can be batched)
export const getDiscoursePostsFromTopic = async (
  params: DiscourseConnectionParams,
  input: DiscoursePostsInput,
  logger: Logger,
): Promise<DiscoursePostsFromTopicResponse> => {
  logger.info({
    message: 'Fetching posts from topic from Discourse',
    params,
    input,
  })
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
    logger.error({ err, params, input }, 'Error while getting posts from topic from Discourse ')
    throw err
  }
}
