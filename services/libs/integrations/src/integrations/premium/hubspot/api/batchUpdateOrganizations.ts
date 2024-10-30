/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig } from 'axios'

import { RequestThrottler } from '@crowd/common'
import { IOrganization, PlatformType } from '@crowd/types'

import { IGenerateStreamsContext, IProcessStreamContext } from '../../../../types'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'

import { getNangoToken } from './../../../nango'
import { IBatchUpdateOrganizationsResult } from './types'

export const batchUpdateOrganizations = async (
  nangoId: string,
  organizations: IOrganization[],
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IBatchUpdateOrganizationsResult[]> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'post',
    url: `https://api.hubapi.com/crm/v3/objects/companies/batch/update`,
    data: {},
    headers: {
      Authorization: '',
    },
  }

  try {
    const hubspotCompanies = []

    for (const organization of organizations) {
      if (organization) {
        // const hubspotSourceId = organization.attributes?.sourceId?.hubspot
        const hubspotSourceId = undefined

        if (!hubspotSourceId) {
          ctx.log.warn(
            `Organization ${organization.id} can't be updated in hubspot! Organization doesn't have a hubspot sourceId.`,
          )
        } else {
          const hubspotCompany = {
            id: hubspotSourceId,
            properties: {},
          } as any

          const fields = organizationMapper.getAllCrowdFields()

          for (const crowdField of fields) {
            const hubspotField = organizationMapper.getHubspotFieldName(crowdField)
            // if hubspot domain field is mapped to a crowd field, we should ignore it
            // because we handle this manually above
            if (hubspotField && hubspotField !== 'domain') {
              if (organization[crowdField] !== undefined) {
                hubspotCompany.properties[hubspotField] = organizationMapper.getHubspotValue(
                  organization,
                  crowdField,
                )
              }
            }
          }

          if (Object.keys(hubspotCompany.properties).length > 0) {
            hubspotCompanies.push(hubspotCompany)
          }
        }
      }
    }

    config.data = {
      inputs: hubspotCompanies,
    }

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)

    ctx.log.debug({ nangoId, accessToken, data: config.data }, 'Updating bulk companies in HubSpot')

    config.headers.Authorization = `Bearer ${accessToken}`

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await throttler.throttle(() => axios(config))

    // return result.data.results.reduce((acc, o) => {
    //   const organization = organizations.find(
    //     (crowdOrganization) => crowdOrganization.attributes?.sourceId?.hubspot === o.id,
    //   )

    //   const hubspotPayload = hubspotCompanies.find((hubspotCompany) => hubspotCompany.id === o.id)

    //   acc.push({
    //     organizationId: organization.id,
    //     sourceId: o.id,
    //     lastSyncedPayload: hubspotPayload,
    //   })

    //   return acc
    // }, [])
    return []
  } catch (err) {
    ctx.log.error({ err }, 'Error while batch update companies in HubSpot')
    throw err
  }
}
