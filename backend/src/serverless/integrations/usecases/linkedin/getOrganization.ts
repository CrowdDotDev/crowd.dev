import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInOrganization } from '../../types/linkedinTypes'
import getToken from '../nango/getToken'
import { handleLinkedinError } from './errorHandler'

export const getOrganization = async (
  nangoId: string,
  organizationId: string,
  logger: Logger,
): Promise<ILinkedInOrganization> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/organizationsLookup`,
    params: {
      ids: `List(${organizationId})`,
      projection:
        '(results*(id,vanityName,localizedName,name,locations,localizedWebsite,logoV2(original~:playableStreams)))',
    },
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
    },
  }

  try {
    logger.debug({ nangoId, organizationId }, 'Fetching organization from LinkedIn')

    // Get an access token from Nango
    const accessToken = await getToken(nangoId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data.results[organizationId]

    let profilePictureUrl: string | undefined

    if (response.logoV2?.['original~']?.elements?.length > 0) {
      const pictures = response.logoV2['original~'].elements
      profilePictureUrl = pictures[pictures.length - 1].identifiers[0].identifier
    }

    return {
      id: parseInt(organizationId, 10),
      name: response.localizedName,
      organizationUrn: `urn:li:organization:${organizationId}`,
      vanityName: response.vanityName,
      profilePictureUrl,
    }
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { nangoId, organizationId }, logger)
    throw newErr
  }
}
