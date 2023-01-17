import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInPostReaction, IPaginatedResponse } from '../../types/linkedinTypes'
import getToken from '../pizzly/getToken'
import { handleLinkedinError } from './errorHandler'

export const getPostReactions = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
  start?: number,
): Promise<IPaginatedResponse<ILinkedInPostReaction>> => {
  const formattedPostId = encodeURIComponent(`(${postId})`)

  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/reactions${formattedPostId}`,
    params: {
      q: 'entity',
      count: 10,
      start,
    },
  }

  try {
    logger.debug({ pizzlyId, postId, start }, 'Fetching post reactions!')

    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    const elements: ILinkedInPostReaction[] = response.elements.map((e) => ({
      memberId: e.created.actor,
      reaction: (e.reactionType as string).toLowerCase(),
      timestamp: e.created.time,
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

export const getAllPostReactions = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
): Promise<ILinkedInPostReaction[]> => {
  const elements = []

  let response = await getPostReactions(pizzlyId, postId, logger)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getPostReactions(pizzlyId, postId, logger, response.start)
    elements.push(...response.elements)
  }

  return elements
}
