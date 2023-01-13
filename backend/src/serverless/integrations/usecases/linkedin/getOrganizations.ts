import axios, { AxiosRequestConfig } from 'axios'
import { ILinkedinOrganization } from '../../types/linkedinTypes'
import { PlatformType } from '../../../../types/integrationEnums'
import getToken from '../pizzly/getToken'
import { Logger } from '../../../../utils/logging'

export const getOrganizations = async (
  pizzlyId: string,
  platform: PlatformType,
  logger: Logger,
): Promise<ILinkedinOrganization[]> => {
  try {
    logger.info({ message: 'Fetching organizations from LinkedIn', pizzlyId })

    // Gett an access token from Pizzly
    const accessToken = await getToken(pizzlyId, platform, logger)

    const config: AxiosRequestConfig<any> = {
      method: 'get',
      url: `https://api.linkedin.com/v2/organizationAcls`,
      params: {
        oauth2_access_token: accessToken,
        q: 'roleAssignee',
        projection:
          '(elements*(*,roleAssignee~(localizedFirstName,localizedLastName),organization~(id,localizedName)))',
      },
    }

    const response = (await axios(config)).data

    return response.elements.map((e) => ({
      id: e['organization~'].id,
      name: e['organization~'].localizedName,
      role: e.role,
      organizationUrn: e.organization,
    }))
  } catch (err) {
    logger.error({ err, pizzlyId }, 'Error while getting organizations from LinkedIn')
    throw err
  }
}
