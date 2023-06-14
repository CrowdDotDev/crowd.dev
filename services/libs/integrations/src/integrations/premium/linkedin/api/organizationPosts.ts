import axios, { AxiosRequestConfig } from 'axios'
import { IGenerateStreamsContext, IProcessStreamContext } from '../../../../types'
import { getNangoToken } from './../../../nango'
import { handleLinkedinError } from './handleError'
import { PlatformType } from '@crowd/types'
import { ILinkedInOrganizationPost, IPaginatedResponse } from './types'

export const getOrganizationPosts = async (
  nangoId: string,
  organization: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  start?: number,
  lookBackUntilTs?: number,
): Promise<IPaginatedResponse<ILinkedInOrganizationPost>> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: 'https://api.linkedin.com/rest/posts',
    params: {
      author: organization,
      q: 'author',
      count: 10,
      ...(start !== undefined && { start }),
    },
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': 202305,
    },
  }

  try {
    ctx.log.debug({ nangoId, organization, start }, 'Fetching organization posts!')
    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.LINKEDIN, ctx)
    config.params.oauth2_access_token = encodeURIComponent(accessToken)

    const response = (await axios(config)).data

    let stop = false

    const elements = response.elements
      .filter((e) => e.publishedAt !== undefined)
      .map((e) => {
        if (lookBackUntilTs && e.createdAt <= lookBackUntilTs) {
          stop = true
        }

        return {
          urnId: e.id,
          lifecycleState: e.lifecycleState,
          visibility: e.visibility,
          authorUrn: e.author,
          body: e.commentary,
          originalUrnId: e.reshareContext?.parent,
          timestamp: e.createdAt,
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
    const newErr = handleLinkedinError(err, config, { nangoId, organization, start }, ctx.log)
    throw newErr
  }
}

export const getAllOrganizationPosts = async (
  nangoId: string,
  organization: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  lookBackUntilTs?: number,
): Promise<ILinkedInOrganizationPost[]> => {
  const elements = []

  let response = await getOrganizationPosts(nangoId, organization, ctx, undefined, lookBackUntilTs)
  elements.push(...response.elements)
  while (response.start !== undefined) {
    response = await getOrganizationPosts(
      nangoId,
      organization,
      ctx,
      response.start,
      lookBackUntilTs,
    )
    elements.push(...response.elements)
  }

  return elements
}
