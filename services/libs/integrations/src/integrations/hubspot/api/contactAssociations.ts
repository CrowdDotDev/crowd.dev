import axios, { AxiosRequestConfig } from 'axios'

import { RequestThrottler } from '@crowd/common'
import { PlatformType } from '@crowd/types'

import { IGenerateStreamsContext, IProcessStreamContext } from '../../../types'
import { getNangoToken } from '../../nango'
import { HubspotAssociationType, HubspotEndpoint, IHubspotAssociation } from '../types'

export const getContactAssociations = async (
  nangoId: string,
  association: HubspotEndpoint,
  type: HubspotAssociationType,
  contactId: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IHubspotAssociation[]> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/${association}`,
  }
  try {
    ctx.log.debug(
      { nangoId },
      `Fetching contact associations [${association}] of contact ${contactId} from HubSpot`,
    )

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)
    config.headers = { Authorization: `Bearer ${accessToken}` }

    const result = await throttler.throttle(() => axios(config))

    const contactAssociations: IHubspotAssociation[] = result?.data?.results || []

    return contactAssociations.filter((a) => a.type === type)
  } catch (err) {
    ctx.log.error({ err }, `Error while getting hubspot contact associations [${association}]`)
    throw err
  }
}
