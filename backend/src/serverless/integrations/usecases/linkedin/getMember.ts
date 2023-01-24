import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInMember } from '../../types/linkedinTypes'
import getToken from '../pizzly/getToken'
import { handleLinkedinError } from './errorHandler'

export const getMember = async (
  pizzlyId: string,
  memberId: string,
  logger: Logger,
): Promise<ILinkedInMember> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/people/(id:${memberId})`,
    params: {
      projection:
        '(id,firstName,localizedFirstName,localizedLastName,vanityName,profilePicture(displayImage~:playableStreams))',
    },
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
    },
  }

  try {
    logger.debug({ pizzlyId, memberId }, 'Fetching member data!')
    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    if (response.id === undefined || response.id === 'private') {
      return {
        id: 'private',
        vanityName: 'private',
        firstName: 'private',
        lastName: 'private',
        country: 'private',
      }
    }

    let profilePictureUrl: string | undefined
    if (response.profilePicture?.['displayImage~']?.elements?.length > 0) {
      const pictures = response.profilePicture['displayImage~'].elements
      profilePictureUrl = pictures[pictures.length - 1].identifiers[0].identifier
    }

    return {
      id: response.id,
      vanityName: response.vanityName,
      firstName: response.localizedFirstName,
      lastName: response.localizedLastName,
      country: response.firstName.preferredLocale.country,
      profilePictureUrl,
    }
  } catch (err) {
    if (err.response?.status === 403) {
      // we can't access this profile because of visibility settings
      return {
        id: 'private',
        vanityName: 'private',
        firstName: 'private',
        lastName: 'private',
        country: 'private',
      }
    }
    const newErr = handleLinkedinError(err, config, { pizzlyId, memberId }, logger)
    throw newErr
  }
}
