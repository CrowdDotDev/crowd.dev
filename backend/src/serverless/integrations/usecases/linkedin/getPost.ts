import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInOrganizationPost } from '../../types/linkedinTypes'
import getToken from '../pizzly/getToken'
import { handleLinkedinError } from './errorHandler'

export const getPost = async (
  pizzlyId: string,
  postId: string,
  logger: Logger,
): Promise<ILinkedInOrganizationPost> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/posts/${postId}`,
  }

  try {
    logger.debug({ pizzlyId, postId }, 'Fetching post!')
    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const e = (await axios(config)).data

    return {
      id: e.id,
      lifecycleState: e.lifecycleState,
      visibility: e.visibility,
      author: e.author,
      title: e.content?.article?.title,
      body: e.commentary,
      originalId: e.reshareContext?.parent,
    }
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { pizzlyId, postId }, logger)
    throw newErr
  }
}
