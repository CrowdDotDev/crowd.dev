/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig } from 'axios'

import { RequestThrottler } from '@crowd/common'
import { IOrganization, OrganizationIdentityType, PlatformType } from '@crowd/types'

import { IGenerateStreamsContext, IProcessStreamContext } from '../../../types'
import { getNangoToken } from '../../nango'
import { HubspotOrganizationFieldMapper } from '../field-mapper/organizationFieldMapper'

import { IBatchCreateOrganizationsResult } from './types'
import { getOrganizationDomain } from './utils/getOrganizationDomain'

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
      const verifiedPrimaryDomains = organization.identities.filter(
        (i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN && i.verified,
      )
      const domains = verifiedPrimaryDomains
        .map((i) => getOrganizationDomain(i.value))
        .filter((i) => i !== null)

      if (domains.length === 0) {
        ctx.log.info(
          `Organization ${organization.id} can't be created in hubspot! Organization doesn't have any associated website or domain can't be derived from existing website.`,
        )
      } else {
        const organizationDomain = domains[0]

        const hubspotCompany = {
          properties: {
            domain: organizationDomain,
          },
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

    config.data = {
      inputs: hubspotCompanies,
    }

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)

    ctx.log.debug(
      { nangoId, accessToken, data: config.data },
      'Creating bulk companies in HubSpot!',
    )

    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    // return hubspot ids back to sync worker for saving
    return result.data.results.reduce((acc, o) => {
      const organization = organizations.find((crowdOrganization) => {
        const domains = crowdOrganization.identities
          .filter((i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN && i.verified)
          .map((i) => getOrganizationDomain(i.value))
          .filter((i) => i !== null)
        return domains.includes(o.properties.domain)
      })

      const hubspotPayload = hubspotCompanies.find(
        (hubspotCompany) => hubspotCompany.properties.domain === o.properties.domain,
      )

      acc.push({
        organizationId: organization.id,
        sourceId: o.id,
        lastSyncedPayload: hubspotPayload,
      })

      return acc
    }, [])
  } catch (err) {
    // this means that organization actually exists in hubspot but we tried re-creating it
    // handle it gracefully
    if (err.response?.data?.category === 'CONFLICT') {
      ctx.log.warn(
        { err },
        'Conflict while batch create companies in HubSpot. Trying to resolve the conflicts.',
      )
      // TODO uros fix this
      // const match = err.response?.data?.message.match(/ID: (\d+)/)
      // const id = match ? match[1] : null
      // if (id) {
      //   const organization = await getCompanyById(nangoId, id, organizationMapper, ctx, throttler)

      //   if (organization) {
      //     // exclude found organization from batch payload
      //     const createOrganizations = organizations.filter(
      //       (o) => !o.website.includes((organization.properties as any).domain),
      //     )

      //     const updateOrganizations = organizations
      //       .filter((o) => o.website.includes((organization.properties as any).domain))
      //       .map((o) => {
      //         o.attributes = {
      //           ...o.attributes,
      //           sourceId: {
      //             hubspot: id,
      //           },
      //         }
      //         return o
      //       })

      //     await batchUpdateOrganizations(
      //       nangoId,
      //       updateOrganizations,
      //       organizationMapper,
      //       ctx,
      //       throttler,
      //     )
      //     return await batchCreateOrganizations(
      //       nangoId,
      //       createOrganizations,
      //       organizationMapper,
      //       ctx,
      //       throttler,
      //     )
      //   }
      // }
    } else {
      ctx.log.error({ err }, 'Error while batch create companies to HubSpot')
      throw err
    }
  }
}
