import axios, { AxiosRequestConfig } from 'axios'
import { RateLimitError } from '@crowd/types'
import { DiscourseConnectionParams, DiscourseTopicsInput, DiscourseTopicResponse } from '../types'
import { IProcessStreamContext } from '../../../types'

export const getDiscourseTopics = async (
  params: DiscourseConnectionParams,
  input: DiscourseTopicsInput,
  ctx: IProcessStreamContext,
): Promise<DiscourseTopicResponse> => {
  ctx.log.info({
    message: 'Fetching categories from Discourse',
    forumHostName: params.forumHostname,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `${params.forumHostname}/c/${input.category_slug}/${input.category_id}.json`,
    headers: {
      'Api-Key': params.apiKey,
      'Api-Username': params.apiUsername,
    },
    params: {
      page: input.page,
    },
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (err) {
    if (err.response && err.response.status === 429) {
      // wait 5 mins
      throw new RateLimitError(5 * 60, 'discourse/gettopics')
    }
    ctx.log.error({ err, params }, 'Error while getting Discourse categories')
    throw err
  }
}
