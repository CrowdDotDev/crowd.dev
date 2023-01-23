import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInOrganizationPost, IPaginatedResponse } from '../../types/linkedinTypes'
import getToken from '../pizzly/getToken'
import { handleLinkedinError } from './errorHandler'

export const getOrganizationPosts = async (
  pizzlyId: string,
  organization: string,
  logger: Logger,
  start?: number,
): Promise<IPaginatedResponse<ILinkedInOrganizationPost>> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: 'https://api.linkedin.com/v2/posts',
    params: {
      author: organization,
      q: 'author',
      count: 10,
      start,
    },
  }

  try {
    logger.debug({ pizzlyId, organization, start }, 'Fetching organization posts!')
    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    const elements = response.elements.map((e) => ({
      urnId: e.id,
      lifecycleState: e.lifecycleState,
      visibility: e.visibility,
      authorUrn: e.author,
      body: e.commentary,
      originalUrnId: e.reshareContext?.parent,
    }))

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
    const newErr = handleLinkedinError(err, config, { pizzlyId, organization, start }, logger)
    throw newErr
  }
}

export const getAllOrganizationPosts = async (
  pizzlyId: string,
  organization: string,
  logger: Logger,
): Promise<ILinkedInOrganizationPost[]> => {
  const elements = []

  let response = await getOrganizationPosts(pizzlyId, organization, logger)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getOrganizationPosts(pizzlyId, organization, logger, response.start)
    elements.push(...response.elements)
  }

  return elements
}
