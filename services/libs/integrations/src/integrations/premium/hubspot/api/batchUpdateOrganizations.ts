import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { IOrganization, PlatformType } from '@crowd/types'
import { RequestThrottler } from '@crowd/common'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'

export const batchUpdateOrganizations = async (
  nangoId: string,
  organizations: IOrganization[],
  organizationMapper: HubspotOrganizationFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<any> => {
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
      const hubspotSourceId = organization.attributes?.sourceId?.hubspot

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

    ctx.log.debug({ nangoId, accessToken, data: config.data }, 'Updating bulk companies in HubSpot')

    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    return result.data?.results || []
  } catch (err) {
    ctx.log.error({ err }, 'Error while batch update companies in HubSpot')
    throw err
  }
}
