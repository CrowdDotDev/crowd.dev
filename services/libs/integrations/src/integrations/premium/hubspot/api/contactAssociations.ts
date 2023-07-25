import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '@crowd/types'
import { getNangoToken } from '../../../nango'
import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { HubspotAssociationType, HubspotEndpoint, IHubspotAssociation } from '../types'

export const getContactAssociations = async (
  nangoId: string,
  association: HubspotEndpoint,
  type: HubspotAssociationType,
  contactId: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<IHubspotAssociation[]> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/${association}`,
  }
  try {
    ctx.log.debug({ nangoId }, `Fetching contact associations [${association}] from HubSpot`)

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)
    config.headers = { Authorization: `Bearer ${accessToken}` }

    const response = (await axios(config)).data

    const contactAssociations: IHubspotAssociation[] = response.results

    return contactAssociations.filter((a) => a.type === type)
  } catch (err) {
    ctx.log.error({ err }, `Error while getting hubspot contact associations [${association}]`)
    throw err
  }
}
