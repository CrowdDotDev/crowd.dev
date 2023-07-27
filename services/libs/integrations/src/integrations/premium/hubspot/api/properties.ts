import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '@crowd/types'
import { getNangoToken } from '../../../nango'
import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { HubspotEndpoint, IHubspotProperty } from '../types'

export const getProperties = async (
  nangoId: string,
  endpoint: HubspotEndpoint,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<IHubspotProperty[]> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/properties/${endpoint}`,
  }
  try {
    ctx.log.debug({ nangoId }, `Fetching ${endpoint} properties from HubSpot`)

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)
    config.headers = { Authorization: `Bearer ${accessToken}` }

    const response = (await axios(config)).data

    const hubspotProperties: IHubspotProperty[] = response.results

    return hubspotProperties.filter((p) => !p.calculated && !p.modificationMetadata.readOnlyValue)
  } catch (err) {
    ctx.log.error({ err }, `Error while getting hubspot ${endpoint} properties!`)
    throw err
  }
}
