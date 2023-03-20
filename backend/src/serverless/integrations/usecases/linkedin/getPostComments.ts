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
  lookBackUntilTs?: number,
): Promise<IPaginatedResponse<ILinkedInPostComment>> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/socialActions/${postId}/comments`,
    params: {
      count: 10,
    },
  }

  try {
    logger.debug({ pizzlyId, postId, start }, 'Fetching organization comments!')
    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    let stop = false

    const elements = response.elements.map((e) => {
      if (lookBackUntilTs && e.created.time <= lookBackUntilTs) {
        stop = true
      }

      let imageUrl: string | undefined
      if (e.content && e.content.length > 0 && e.content[0].type === 'IMAGE') {
        imageUrl = e.content[0].url
      }

      return {
        authorUrn: e.actor,
        timestamp: e.created.time,
        comment: e.message.text,
        imageUrl,
        urnId: e.$URN,
        objectUrn: e.object,
        childComments: e.commentsSummary?.aggregatedTotalComments || 0,
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

export const getAllPostComments = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
  lookBackUntilTs?: number,
): Promise<ILinkedInPostComment[]> => {
  const elements = []

  let response = await getPostComments(pizzlyId, postId, logger, undefined, lookBackUntilTs)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getPostComments(pizzlyId, postId, logger, response.start, lookBackUntilTs)
    elements.push(...response.elements)
  }

  return elements
}
