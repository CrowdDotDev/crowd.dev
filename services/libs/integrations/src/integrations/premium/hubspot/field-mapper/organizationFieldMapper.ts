import { IOrganization, MemberAttributeName, PlatformType } from '@crowd/types'
import { HubspotPropertyType, IHubspotObject } from '../types'
import { HubspotFieldMapper } from './hubspotFieldMapper'

export class HubspotOrganizationFieldMapper extends HubspotFieldMapper {
  protected typeMap: Record<string, HubspotPropertyType> = {
    name: HubspotPropertyType.STRING,
    url: HubspotPropertyType.STRING,
    description: HubspotPropertyType.STRING,
    emails: HubspotPropertyType.STRING,
    logo: HubspotPropertyType.STRING,
    tags: HubspotPropertyType.STRING,
    github: HubspotPropertyType.STRING,
    twitter: HubspotPropertyType.STRING,
    linkedin: HubspotPropertyType.STRING,
    crunchbase: HubspotPropertyType.STRING,
    employees: HubspotPropertyType.NUMBER,
    location: HubspotPropertyType.STRING,
    website: HubspotPropertyType.STRING,
    type: HubspotPropertyType.ENUMERATION,
    size: HubspotPropertyType.STRING,
    headline: HubspotPropertyType.STRING,
    industry: HubspotPropertyType.ENUMERATION,
    founded: HubspotPropertyType.STRING,
    activityCount: HubspotPropertyType.NUMBER,
    memberCount: HubspotPropertyType.NUMBER,
    activeOn: HubspotPropertyType.STRING,
    identities: HubspotPropertyType.STRING,
    lastActive: HubspotPropertyType.DATETIME,
  }

  override getFieldTypeMap(): Record<string, HubspotPropertyType> {
    return this.typeMap
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

      if (crowdKey && organizationProperties[hubspotPropertyName] !== null) {
        organization[crowdKey] = organizationProperties[hubspotPropertyName]

        // fix for linkedin social, it comes as a full url
        if (crowdKey === 'linkedin') {
          const linkedinHandle = organizationProperties[hubspotPropertyName].split('/').pop()
          organization[crowdKey] = linkedinHandle
        }
      }
    }
    return organization
  }
}
