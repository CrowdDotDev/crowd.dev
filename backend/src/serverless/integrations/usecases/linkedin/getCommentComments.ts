import axios, { AxiosRequestConfig } from 'axios'
import { ILinkedInPostComment, IPaginatedResponse } from '../../types/linkedinTypes'
import { Logger } from '../../../../utils/logging'
import { handleLinkedinError } from './errorHandler'
import getToken from '../pizzly/getToken'
import { PlatformType } from '../../../../types/integrationEnums'

export const getCommentComments = async (
  pizzlyId: string,
  commentId: string,
  logger: Logger,
  start?: number,
): Promise<IPaginatedResponse<ILinkedInPostComment>> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/socialActions/${commentId}/comments`,
    params: {
      count: 10,
      start,
    },
  }

  try {
    logger.debug({ pizzlyId, commentId, start }, 'Fetching comment comments!')
    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    const elements: ILinkedInPostComment[] = response.elements.map((e) => ({
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
    const newErr = handleLinkedinError(err, config, { pizzlyId, commentId, start }, logger)
    throw newErr
  }
}

export const getAllCommentComments = async (
  pizzlyId: string,
  commentId: string,
  logger: Logger,
): Promise<ILinkedInPostComment[]> => {
  const elements = []

  let response = await getCommentComments(pizzlyId, commentId, logger)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getCommentComments(pizzlyId, commentId, logger, response.start)
    elements.push(...response.elements)
  }

  return elements
}
