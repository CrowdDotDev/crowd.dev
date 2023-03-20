import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInOrganizationPost } from '../../types/linkedinTypes'
import getToken from '../nango/getToken'
import { handleLinkedinError } from './errorHandler'

export const getPost = async (
  nangoId: string,
  postId: string,
  logger: Logger,
): Promise<ILinkedInOrganizationPost> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/posts/${postId}`,
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
    },
  }

  try {
    logger.debug({ nangoId, postId }, 'Fetching post!')
    // Get an access token from Nango
    const accessToken = await getToken(nangoId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const e = (await axios(config)).data

    return {
      urnId: e.id,
      lifecycleState: e.lifecycleState,
      visibility: e.visibility,
      authorUrn: e.author,
      body: e.commentary,
      originalUrnId: e.reshareContext?.parent,
      timestamp: e.createdAt,
    }
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { nangoId, postId }, logger)
    throw newErr
  }
}
