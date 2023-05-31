import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import type { DiscourseConnectionParams } from '../../types/discourseTypes'
import { DiscourseCategoryResponse, DiscourseTopicsInput } from '../../types/discourseTypes'

export const getDiscourseTopics = async (
  params: DiscourseConnectionParams,
  input: DiscourseTopicsInput,
  logger: Logger,
): Promise<DiscourseCategoryResponse> => {
  logger.info({
    message: 'Fetching categories from Discourse',
    forumHostName: params.forumHostname,
  })
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
    logger.error({ err, params }, 'Error while getting Discourse categories')
    throw err
  }
}
