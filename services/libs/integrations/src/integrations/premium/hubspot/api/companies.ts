import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { IHubspotContact, IHubspotObject } from '../types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { PlatformType } from '@crowd/types'
import { IPaginatedResponse } from './types'
import { RequestThrottler } from '@crowd/common'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'
import { HUBSPOT_API_PAGE_SIZE } from './common'

export const getCompanies = async (
  nangoId: string,
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
  after?: string,
): Promise<IPaginatedResponse<IHubspotContact>> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/companies`,
    params: {
      limit: HUBSPOT_API_PAGE_SIZE,
      properties: `name,domain,${organizationMapper.getAllHubspotFields().join(',')}`,
    },
    headers: {
      Authorization: '',
    },
  }

  try {
    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)

    ctx.log.debug({ nangoId, accessToken }, 'Fetching contacts from HubSpot')

    config.headers.Authorization = `Bearer ${accessToken}`

    // set pagination
    config.params.after = after

    const result = await throttler.throttle(() => axios(config))

    const elements = result.data.results as IHubspotObject[]

    if (result.data.paging?.next?.after) {
      return {
        elements,
        after: result.data.paging.next.after,
      }
    }

    return {
      elements,
    }
  } catch (err) {
    ctx.log.error({ err }, 'Error while fetching companies from HubSpot')
    throw err
  }
}

export async function* getAllCompanies(
  nangoId: string,
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): AsyncGenerator<IHubspotObject[], void, undefined> {
  let hasNextPage = true
  let after = undefined

  while (hasNextPage) {
    const response = await getCompanies(nangoId, organizationMapper, ctx, throttler, after)

    hasNextPage = response.after !== undefined

    after = response.after

    yield response.elements
  }
}
