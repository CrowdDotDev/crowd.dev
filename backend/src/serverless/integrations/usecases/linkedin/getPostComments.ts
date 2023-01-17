import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInPostComment, IPaginatedResponse } from '../../types/linkedinTypes'
import getToken from '../pizzly/getToken'
import { handleLinkedinError } from './errorHandler'

export const getPostComments = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
  start?: number,
): Promise<IPaginatedResponse<ILinkedInPostComment>> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/socialActions/${postId}/comments`,
    params: {
      count: 10,
    },
  }

  try {
    logger.debug({ pizzlyId, postId, start }, 'Fetching organization posts!')
    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    const elements = response.elements.map((e) => ({
      memberId: e.actor,
      timestamp: e.created.time,
      comment: e.message.text,
      id: e.$URN,
      childComments: e.commentsSummary?.aggregatedTotalComments || 0,
    }))

    if (response.paging) {
      return {
        elements,
        start: response.paging.start + response.paging.count,
      }
    }

    return {
      elements,
    }
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { pizzlyId, postId, start }, logger)
    throw newErr
  }
}

export const getAllPostComments = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
): Promise<ILinkedInPostComment[]> => {
  const elements = []

  let response = await getPostComments(pizzlyId, postId, logger)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getPostComments(pizzlyId, postId, logger, response.start)
    elements.push(...response.elements)
  }

  return elements
}
