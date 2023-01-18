import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '../../../../types/integrationEnums'
import { Logger } from '../../../../utils/logging'
import { ILinkedInOrganization } from '../../types/linkedinTypes'
import getToken from '../pizzly/getToken'
import { handleLinkedinError } from './errorHandler'

export const getOrganization = async (
  pizzlyId: string,
  organizationId: string,
  logger: Logger,
): Promise<ILinkedInOrganization> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/organizationsLookup`,
    params: {
      ids: `List(${organizationId})`,
    },
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
    },
  }

  try {
    logger.debug({ pizzlyId, organizationId }, 'Fetching organization from LinkedIn')

    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data.results[organizationId]

    return {
      id: parseInt(organizationId, 10),
      name: response.localizedName,
      organizationUrn: `urn:li:organization:${organizationId}`,
      vanityName: response.vanityName,
    }
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { pizzlyId, organizationId }, logger)
    throw newErr
  }
}
