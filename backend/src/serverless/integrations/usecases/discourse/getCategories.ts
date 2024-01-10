import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'
import type { DiscourseConnectionParams } from '../../types/discourseTypes'
import { DiscourseCategoryResponse } from '../../types/discourseTypes'

export const getDiscourseCategories = async (
  params: DiscourseConnectionParams,
  logger: Logger,
): Promise<DiscourseCategoryResponse> => {
  logger.info({
    message: 'Fetching categories from Discourse',
    forumHostName: params.forumHostname,
  })
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `${params.forumHostname}/categories.json`,
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
      throw new RateLimitError(5 * 60, 'discourse/getcategories')
    }
    logger.error({ err, params }, 'Error while getting Discourse categories')
    throw err
  }
}
