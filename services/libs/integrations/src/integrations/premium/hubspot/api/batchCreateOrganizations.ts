import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { IOrganization, PlatformType } from '@crowd/types'
import { RequestThrottler } from '@crowd/common'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'
import { getOrganizationDomain } from './utils/getOrganizationDomain'

export interface IBatchCreateOrganizationsResult {
  organizationId: string
  sourceId: string
}

export const batchCreateOrganizations = async (
  nangoId: string,
  organizations: IOrganization[],
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IBatchCreateOrganizationsResult[]> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'post',
    url: `https://api.hubapi.com/crm/v3/objects/companies/batch/create`,
    data: {},
    headers: {
      Authorization: '',
    },
  }

  try {
    const hubspotCompanies = []

    for (const organization of organizations) {
      if (!organization.website) {
        ctx.log.warn(
          `Organization ${organization.id} can't be created in hubspot! Organization doesn't have any associated website.`,
        )
      } else {
        const organizationDomain = getOrganizationDomain(organization.website)

        const hubspotCompany = {
          properties: {
            domain: organizationDomain,
          },
        } as any

        const fields = organizationMapper.getAllCrowdFields()

        for (const crowdField of fields) {
          const hubspotField = organizationMapper.getHubspotFieldName(crowdField)

          if (hubspotField && organization[crowdField] !== undefined) {
            hubspotCompany.properties[hubspotField] = organizationMapper.getCrowdValue(
              organization,
              crowdField,
            )
          }
        }

        if (Object.keys(hubspotCompany.properties).length > 0) {
          hubspotCompanies.push(hubspotCompany)
        }
      }
    }

    config.data = {
      inputs: hubspotCompanies,
    }

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)

    ctx.log.debug(
      { nangoId, accessToken, data: config.data },
      'Creating bulk companies in HubSpot!',
    )

    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    // return hubspot ids back to sync worker for saving
    return result.data.results.reduce((acc, o) => {
      const organization = organizations.find(
        (crowdOrganization) =>
          crowdOrganization.website &&
          getOrganizationDomain(crowdOrganization.website) === o.properties.domain,
      )
      acc.push({
        organizationId: organization.id,
        sourceId: o.id,
      })
      return acc
    }, [])
  } catch (err) {
    ctx.log.error({ err }, 'Error while batch create companies in HubSpot!')
    throw err
  }
}
