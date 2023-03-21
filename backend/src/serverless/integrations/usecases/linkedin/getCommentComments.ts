import axios, { AxiosRequestConfig } from 'axios'
import { ILinkedInPostComment, IPaginatedResponse } from '../../types/linkedinTypes'
import { Logger } from '../../../../utils/logging'
import { handleLinkedinError } from './errorHandler'
import getToken from '../nango/getToken'
import { PlatformType } from '../../../../types/integrationEnums'

export const getCommentComments = async (
  nangoId: string,
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
    logger.debug({ nangoId, commentId, start }, 'Fetching comment comments!')
    // Get an access token from Nango
    const accessToken = await getToken(nangoId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    const elements: ILinkedInPostComment[] = response.elements.map((e) => {
      let imageUrl: string | undefined
      if (e.content && e.content.length > 0 && e.content[0].type === 'IMAGE') {
        imageUrl = e.content[0].url
      }

      return {
        authorUrn: e.actor,
        parentUrnId: e.parentComment,
        timestamp: e.created.time,
        comment: e.message.text,
        imageUrl,
        urnId: e.$URN,
        objectUrn: e.object,
        childComments: e.commentsSummary?.aggregatedTotalComments || 0,
      }
    })

    if (response.paging.links.find((l) => l.rel === 'next')) {
      return {
        elements,
        start: response.paging.start + response.paging.count,
      }
    }

    return {
      elements,
    }
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { nangoId, commentId, start }, logger)
    throw newErr
  }
}

export const getAllCommentComments = async (
  nangoId: string,
  commentId: string,
  logger: Logger,
): Promise<ILinkedInPostComment[]> => {
  const elements = []

  let response = await getCommentComments(nangoId, commentId, logger)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getCommentComments(nangoId, commentId, logger, response.start)
    elements.push(...response.elements)
  }

  return elements
}
