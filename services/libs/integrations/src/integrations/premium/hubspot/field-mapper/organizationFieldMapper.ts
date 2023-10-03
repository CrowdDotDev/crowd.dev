/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  IOrganization,
  OrganizationAttributeName,
  PlatformType,
  OrganizationSource,
} from '@crowd/types'
import { HubspotPropertyType, IFieldProperty, IHubspotObject } from '../types'
import { HubspotFieldMapper } from './hubspotFieldMapper'
import { serializeArray } from './utils/serialization'

export class HubspotOrganizationFieldMapper extends HubspotFieldMapper {
  protected fieldProperties: Record<string, IFieldProperty> = {
    name: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
    },
    url: {
      hubspotType: HubspotPropertyType.STRING,
    },
    description: {
      hubspotType: HubspotPropertyType.STRING,
    },
    emails: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    logo: {
      hubspotType: HubspotPropertyType.STRING,
    },
    tags: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    github: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (github: any) => {
        return github.handle
      },
    },
    twitter: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (twitter: any) => {
        return twitter.handle
      },
    },
    linkedin: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (linkedin: any) => {
        return linkedin?.handle ? linkedin.handle : undefined
      },
    },
    crunchbase: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (crunchbase: any) => {
        return crunchbase.handle
      },
    },
    // revenueRange: {
    //   hubspotType: HubspotPropertyType.STRING,
    //   readonly: true,
    //   serialize: (revenueRange: any) => {
    //     return JSON.stringify(revenueRange)
    //   },
    // },
    revenueRangeMin: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    revenueRangeMax: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    employeeCountByCountry: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (employeeCountByCountry: any) => {
        return JSON.stringify(employeeCountByCountry)
      },
    },
    employees: {
      hubspotType: HubspotPropertyType.NUMBER,
    },
    location: {
      hubspotType: HubspotPropertyType.STRING,
    },
    website: {
      hubspotType: HubspotPropertyType.STRING,
    },
    type: {
      hubspotType: HubspotPropertyType.ENUMERATION,
    },
    size: {
      hubspotType: HubspotPropertyType.STRING,
    },
    headline: {
      hubspotType: HubspotPropertyType.STRING,
    },
    industry: {
      hubspotType: HubspotPropertyType.ENUMERATION,
    },
    founded: {
      hubspotType: HubspotPropertyType.STRING,
    },
    activityCount: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    memberCount: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    affiliatedProfiles: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    allSubsidiaries: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    alternativeDomains: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    alternativeNames: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    averageEmployeeTenure: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    averageTenureByLevel: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (averageTenureByLevel: any) => {
        return JSON.stringify(averageTenureByLevel)
      },
    },
    averageTenureByRole: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (averageTenureByRole: any) => {
        return JSON.stringify(averageTenureByRole)
      },
    },
    directSubsidiaries: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: serializeArray,
    },
    // employeeChurnRate: {
    //   hubspotType: HubspotPropertyType.STRING,
    //   readonly: true,
    //   serialize: (employeeChurnRate: any) => {
    //     return JSON.stringify(employeeChurnRate)
    //   },
    // },
    employeeCountByMonth: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (employeeCountByMonth: any) => {
        return JSON.stringify(employeeCountByMonth)
      },
    },
    employeeChurnRate12Month: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    // employeeGrowthRate: {
    //   hubspotType: HubspotPropertyType.STRING,
    //   readonly: true,
    //   serialize: (employeeGrowthRate: any) => {
    //     return JSON.stringify(employeeGrowthRate)
    //   },
    // },
    employeeGrowthRate12Month: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    employeeCountByMonthByLevel: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (employeeCountByMonthByLevel: any) => {
        return JSON.stringify(employeeCountByMonthByLevel)
      },
    },
    employeeCountByMonthByRole: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (employeeCountByMonthByRole: any) => {
        return JSON.stringify(employeeCountByMonthByRole)
      },
    },
    gicsSector: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
    },
    grossAdditionsByMonth: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (grossAdditionsByMonth: any) => {
        return JSON.stringify(grossAdditionsByMonth)
      },
    },
    grossDeparturesByMonth: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (grossDeparturesByMonth: any) => {
        return JSON.stringify(grossDeparturesByMonth)
      },
    },
    immediateParent: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
    },
    ultimateParent: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
    },
  }

  override getFieldProperties(): Record<string, IFieldProperty> {
    return this.fieldProperties
  }

  public getSocialUrl(platform: string, handle: string): string {
    if (!platform || !handle) {
      return null
    }

    switch (platform) {
      case PlatformType.TWITTER:
        return `https://twitter.com/${handle}`
      case PlatformType.LINKEDIN:
        return `https://linkedin.com/company/${handle}`
      case PlatformType.CRUNCHBASE:
        return `https://crunchbase.com/organization/${handle}`
      case PlatformType.GITHUB:
        return `https://github.com/${handle}`
      default:
        return null
    }
  }

  override getEntity(hubspotOrganization: IHubspotObject): IOrganization {
    this.ensureFieldMapExists()

    if (!this.hubspotId) {
      throw new Error('Hubspot Id should be set before parsing the organization!')
    }

    const organizationProperties = hubspotOrganization.properties as any

    if (!organizationProperties.name) {
      throw new Error(
        'Organization returned from HubSpot API is missing the unique identifier name field!',
      )
    }

    const organization: IOrganization = {
      identities: [
        {
          name: organizationProperties.name,
          platform: PlatformType.HUBSPOT,
          sourceId: hubspotOrganization.id,
          url: `https://app.hubspot.com/contacts/${this.hubspotId}/company/${hubspotOrganization.id}`,
        },
      ],
      attributes: {
        [OrganizationAttributeName.SOURCE_ID]: {
          [PlatformType.HUBSPOT]: hubspotOrganization.id,
        },
        [OrganizationAttributeName.URL]: {
          [PlatformType.HUBSPOT]: `https://app.hubspot.com/contacts/${this.hubspotId}/company/${hubspotOrganization.id}`,
        },
        [OrganizationAttributeName.DOMAIN]: {
          [PlatformType.HUBSPOT]: organizationProperties.domain,
        },
      },
      source: OrganizationSource.HUBSPOT,
    }

    // loop through organization properties
    for (const hubspotPropertyName of Object.keys(organizationProperties)) {
      const crowdKey = this.getCrowdFieldName(hubspotPropertyName)

      // discard readonly fields, readonly fields will be only used when pushing data back to hubspot
      if (crowdKey && !this.fieldProperties[crowdKey].readonly) {
        if (organizationProperties[hubspotPropertyName] !== null) {
          organization[crowdKey] = organizationProperties[hubspotPropertyName]

          // add additional identities to org using social fields come from hubspot
          if (
            [
              PlatformType.LINKEDIN,
              PlatformType.TWITTER,
              PlatformType.GITHUB,
              PlatformType.CRUNCHBASE,
            ].includes(crowdKey as PlatformType)
          ) {
            // fix for linkedin social, it comes as a full url
            if (crowdKey === PlatformType.LINKEDIN) {
              const linkedinHandle = organizationProperties[hubspotPropertyName].split('/').pop()
              organization[crowdKey] = linkedinHandle
            }

            organization.identities.push({
              name: organization[crowdKey],
              platform: crowdKey,
              url: this.getSocialUrl(crowdKey, organization[crowdKey]),
              sourceId: null,
            })
          }
        }
      }
    }
    return organization
  }
}
