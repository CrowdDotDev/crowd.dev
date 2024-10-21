import axios, { AxiosRequestConfig } from 'axios'

import { RequestThrottler } from '@crowd/common'
import { PlatformType } from '@crowd/types'

import { IGenerateStreamsContext, IProcessStreamContext } from '../../../../types'
import { HubspotMemberFieldMapper } from '../field-mapper/memberFieldMapper'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'
import { HubspotAssociationType, HubspotEndpoint, IHubspotContact, IHubspotObject } from '../types'

import { getNangoToken } from './../../../nango'
import { HUBSPOT_API_PAGE_SIZE } from './common'
import { getCompanyById } from './companyById'
import { getContactAssociations } from './contactAssociations'
import { IPaginatedResponse } from './types'

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

  // If we're not onboarding, only get data that was updated in last 8 hours
  if (!ctx.onboarding) {
    const date = new Date()
    date.setHours(date.getHours() - 8)

    config.params.filterGroups = JSON.stringify([
      {
        filters: [
          {
            value: date.getTime(),
            propertyName: 'hs_lastmodifieddate',
            operator: 'GT',
          },
        ],
      },
    ])
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
