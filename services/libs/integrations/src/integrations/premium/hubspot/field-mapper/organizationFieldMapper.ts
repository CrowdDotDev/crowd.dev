import { IOrganization, MemberAttributeName, PlatformType } from '@crowd/types'
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
        return linkedin.handle
      },
    },
    crunchbase: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (crunchbase: any) => {
        return crunchbase.handle
      },
    },
    revenueRange: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (revenueRange: any) => {
        return JSON.stringify(revenueRange)
      },
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
  }

  override getFieldProperties(): Record<string, IFieldProperty> {
    return this.fieldProperties
  }

  override getEntity(hubspotOrganization: IHubspotObject): IOrganization {
    this.ensureFieldMapExists()

    const organizationProperties = hubspotOrganization.properties as any

    if (!organizationProperties.name) {
      throw new Error(
        'Organization returned from HubSpot API is missing the unique identifier name field!',
      )
    }

    const organization: IOrganization = {
      name: organizationProperties.name,
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.HUBSPOT]: hubspotOrganization.id,
        },
      },
    }

    // loop through organization properties
    for (const hubspotPropertyName of Object.keys(organizationProperties)) {
      const crowdKey = this.getCrowdFieldName(hubspotPropertyName)

      // discard readonly fields, readonly fields will be only used when pushing data back to hubspot
      if (!this.fieldProperties[crowdKey].readonly) {
        if (crowdKey && organizationProperties[hubspotPropertyName] !== null) {
          organization[crowdKey] = organizationProperties[hubspotPropertyName]

          // fix for linkedin social, it comes as a full url
          if (crowdKey === 'linkedin') {
            const linkedinHandle = organizationProperties[hubspotPropertyName].split('/').pop()
            organization[crowdKey] = linkedinHandle
          }
        }
      }
    }
    return organization
  }
}
