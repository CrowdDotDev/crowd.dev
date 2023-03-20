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
  lookBackUntilTs?: number,
): Promise<IPaginatedResponse<ILinkedInPostReaction>> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/reactions/(entity:${encodeURIComponent(postId)})`,
    params: {
      q: 'entity',
      count: 10,
      sort: 'REVERSE_CHRONOLOGICAL',
      start,
    },
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
    },
  }

  try {
    logger.debug({ pizzlyId, postId, start }, 'Fetching post reactions!')

    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    let stop = false

    const elements: ILinkedInPostReaction[] = response.elements.map((e) => {
      if (lookBackUntilTs && e.created.time <= lookBackUntilTs) {
        stop = true
      }

      return {
        authorUrn: e.created.actor,
        reaction: (e.reactionType as string).toLowerCase(),
        timestamp: e.created.time,
      }
    })

    if (stop) {
      return {
        elements,
      }
    }

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
    const newErr = handleLinkedinError(err, config, { pizzlyId, postId, start }, logger)
    throw newErr
  }
}

export const getAllPostReactions = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
  lookBackUntilTs?: number,
): Promise<ILinkedInPostReaction[]> => {
  const elements = []

  let response = await getPostReactions(pizzlyId, postId, logger, undefined, lookBackUntilTs)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getPostReactions(pizzlyId, postId, logger, response.start, lookBackUntilTs)
    elements.push(...response.elements)
  }

  return elements
}
