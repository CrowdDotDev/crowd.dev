import axios, { AxiosRequestConfig } from 'axios'
import { handleLinkedinError } from './errorHandler'
import { ILinkedInOrganization } from '../../types/linkedinTypes'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'
import { Logger } from '../../../../utils/logging'

export const getOrganizations = async (
  pizzlyId: string,
  logger: Logger,
): Promise<ILinkedInOrganization[]> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.linkedin.com/v2/organizationAcls`,
    params: {
      q: 'roleAssignee',
      projection:
        '(elements*(*,roleAssignee~(localizedFirstName,localizedLastName),organization~(id,localizedName)))',
    },
  }
  try {
    logger.debug({ pizzlyId }, 'Fetching organizations from LinkedIn')

    // Get an access token from Pizzly
    const accessToken = await getToken(pizzlyId, PlatformType.LINKEDIN, logger)
    config.params.oauth2_access_token = accessToken

    const response = (await axios(config)).data

    return response.data.elements.map((e) => ({
      id: e['organization~'].id,
      name: e['organization~'].localizedName,
      role: e.role,
      organizationUrn: e.organization,
    }))
  } catch (err) {
    const newErr = handleLinkedinError(err, config, { pizzlyId }, logger)
    throw newErr
  }
}
