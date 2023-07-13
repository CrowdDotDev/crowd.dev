import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { IHubspotObject } from '../types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { PlatformType } from '@crowd/types'
import { RequestThrottler } from '@/integrations/requestThrottler'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'

export const getCompanyById = async (
  nangoId: string,
  companyId: string,
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IHubspotObject> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
    params: {
      limit: 1,
      properties: `name,domain,${organizationMapper.getAllHubspotFields().join(',')}`,
    },
    headers: {
      Authorization: '',
    },
  }

  try {
    ctx.log.debug({ nangoId, companyId }, 'Fetching company by id from HubSpot')

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)

    ctx.log.debug({ accessToken }, `nango token`)
    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    const element = result.data

    if (!element) {
      return null
    }

    return element
  } catch (err) {
    ctx.log.error({ err }, 'Error while fetching contacts from HubSpot')
    throw err
  }
}
