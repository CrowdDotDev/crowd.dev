import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '@crowd/types'
import { getNangoToken } from '../../../nango'
import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { IHubspotProperty } from '../types'

export const getContactProperties = async (
  nangoId: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<IHubspotProperty[]> => {
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/properties/contacts`,
  }
  try {
    ctx.log.debug({ nangoId }, 'Fetching contact properties from HubSpot')

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)
    config.headers = { Authorization: `Bearer ${accessToken}` }

    const response = (await axios(config)).data

    const hubspotProperties: IHubspotProperty[] = response.results

    return hubspotProperties.filter((p) => !p.calculated && !p.modificationMetadata.readOnlyValue)
  } catch (err) {
    ctx.log.error({ err }, 'Error while getting hubspot contact properties!')
    throw err
  }
}
