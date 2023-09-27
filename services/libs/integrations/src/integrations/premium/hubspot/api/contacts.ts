import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { HubspotAssociationType, HubspotEndpoint, IHubspotContact, IHubspotObject } from '../types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { PlatformType } from '@crowd/types'
import { IPaginatedResponse } from './types'
import { RequestThrottler } from '@crowd/common'
import { HubspotMemberFieldMapper } from '../field-mapper/memberFieldMapper'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'
import { getContactAssociations } from './contactAssociations'
import { getCompanyById } from './companyById'
import { HUBSPOT_API_PAGE_SIZE } from './common'

export const getContacts = async (
  nangoId: string,
  memberMapper: HubspotMemberFieldMapper,
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
  includeOrganizations = false,
  after?: string,
): Promise<IPaginatedResponse<IHubspotContact>> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/contacts`,
    params: {
      limit: HUBSPOT_API_PAGE_SIZE,
      properties: `email,${memberMapper.getAllHubspotFields().join(',')}`,
    },
    headers: {
      Authorization: '',
    },
  }

  try {
    ctx.log.debug({ nangoId }, 'Fetching contacts from HubSpot')

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)

    ctx.log.debug({ accessToken }, `nango token`)
    config.headers.Authorization = `Bearer ${accessToken}`

    // set pagination
    config.params.after = after

    const result = await throttler.throttle(() => axios(config))

    const elements = result.data.results as IHubspotContact[]

    if (includeOrganizations) {
      for (const element of elements) {
        // check association
        const companyAssociations = await getContactAssociations(
          nangoId,
          HubspotEndpoint.COMPANIES,
          HubspotAssociationType.CONTACT_TO_COMPANY,
          element.id,
          ctx,
          throttler,
        )

        if (companyAssociations.length > 0) {
          // get company
          const company = await getCompanyById(
            nangoId,
            companyAssociations[0].id,
            organizationMapper,
            ctx,
            throttler,
          )

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((company?.properties as any)?.name) {
            element.organization = company
          }
        }
      }
    }

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
    ctx.log.error({ err }, 'Error while fetching contacts from HubSpot')
    throw err
  }
}

export async function* getAllContacts(
  nangoId: string,
  memberMapper: HubspotMemberFieldMapper,
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
  includeOrganizations = false,
): AsyncGenerator<IHubspotObject[], void, undefined> {
  let hasNextPage = true
  let after = undefined

  while (hasNextPage) {
    const response = await getContacts(
      nangoId,
      memberMapper,
      organizationMapper,
      ctx,
      throttler,
      includeOrganizations,
      after,
    )

    hasNextPage = response.after !== undefined

    after = response.after

    yield response.elements
  }
}
