import {
  IMemberAttribute,
  IMemberData,
  IMemberIdentity,
  MemberAttributeName,
  MemberAttributeType,
  PlatformType,
} from '@crowd/types'
import { HubspotPropertyType, IHubspotContact } from '../types'
import { HubspotFieldMapper } from './hubspotFieldMapper'
import { HubspotOrganizationFieldMapper } from './organizationFieldMapper'

export class HubspotMemberFieldMapper extends HubspotFieldMapper {
  protected typeMap: Record<string, HubspotPropertyType> = {
    id: HubspotPropertyType.STRING,
    tenantId: HubspotPropertyType.STRING,
    segmentId: HubspotPropertyType.STRING,
    displayName: HubspotPropertyType.STRING,
    score: HubspotPropertyType.NUMBER,
    lastEnriched: HubspotPropertyType.DATETIME,
    emails: HubspotPropertyType.STRING,
    joinedAt: HubspotPropertyType.DATETIME,
    createdAt: HubspotPropertyType.DATETIME,
    reach: HubspotPropertyType.NUMBER,
    numberOfOpensourceContributions: HubspotPropertyType.NUMBER,
    activityCount: HubspotPropertyType.NUMBER,
    activeDaysCount: HubspotPropertyType.NUMBER,
    lastActive: HubspotPropertyType.DATETIME,
    averageSentiment: HubspotPropertyType.NUMBER,
    tags: HubspotPropertyType.STRING,
    organizationName: HubspotPropertyType.STRING,
  }

  public customAttributes?: IMemberAttribute[]

  public identities?: IMemberIdentity[]

  constructor(customAttributes?: IMemberAttribute[], identities?: IMemberIdentity[]) {
    super()

    if (customAttributes && identities) {
      this.customAttributes = customAttributes
      this.identities = identities
      this.typeMap = this.getFieldTypeMap()
    }
  }

  override getFieldTypeMap(): Record<string, HubspotPropertyType> {
    for (const customAttribute of this.customAttributes) {
      if (customAttribute.type === MemberAttributeType.BOOLEAN) {
        this.typeMap[`attributes.${customAttribute.name}`] = HubspotPropertyType.BOOL
      } else if (customAttribute.type === MemberAttributeType.DATE) {
        this.typeMap[`attributes.${customAttribute.name}`] = HubspotPropertyType.DATETIME
      } else if (customAttribute.type === MemberAttributeType.NUMBER) {
        this.typeMap[`attributes.${customAttribute.name}`] = HubspotPropertyType.NUMBER
      } else if (
        [MemberAttributeType.EMAIL, MemberAttributeType.STRING, MemberAttributeType.URL].includes(
          customAttribute.type,
        )
      ) {
        this.typeMap[`attributes.${customAttribute.name}`] = HubspotPropertyType.STRING
      }
    }

    for (const identity of this.identities) {
      this.typeMap[`identities.${identity.platform}`] = HubspotPropertyType.STRING
    }

    return this.typeMap
  }

  override getEntity(
    hubspotContact: IHubspotContact,
    organizationMapper: HubspotOrganizationFieldMapper,
  ): IMemberData {
    this.ensureFieldMapExists()

    if (!this.hubspotId) {
      throw new Error('Hubspot Id should be set before parsing the member!')
    }

    const contactProperties = hubspotContact.properties as any

    if (!contactProperties.email) {
      throw new Error(
        'Member returned from HubSpot API is missing the unique identifier e-mail field!',
      )
    }

    // only staticly defined property is email, also used as hubspot identity
    const member: IMemberData = {
      emails: [contactProperties.email],
      identities: [
        {
          platform: PlatformType.HUBSPOT,
          username: contactProperties.email,
        },
      ],
      attributes: {
        [MemberAttributeName.SOURCE_ID]: {
          [PlatformType.HUBSPOT]: hubspotContact.id,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.HUBSPOT]: `https://app.hubspot.com/contacts/${this.hubspotId}/contact/${hubspotContact.id}`,
        },
      },
    }

    // loop through member properties
    for (const hubspotPropertyName of Object.keys(contactProperties)) {
      const crowdKey = this.getCrowdFieldName(hubspotPropertyName)

      // For incoming integrations, we already get the member email from hubspot defined field `email`
      // if user mapped `emails` to some other field
      // this will be saved to the mapped field when sending the member back to hubspot via outgoing integrations
      if (crowdKey && crowdKey !== 'emails' && contactProperties[hubspotPropertyName] !== null) {
        if (crowdKey.startsWith('attributes')) {
          const crowdAttributeName = crowdKey.split('.')[1] || null

          if (crowdAttributeName) {
            member.attributes[crowdAttributeName] = {
              [PlatformType.HUBSPOT]: contactProperties[hubspotPropertyName],
            }
          }
        } else if (crowdKey.startsWith('identities')) {
          const identityPlatform = crowdKey.split('.')[1] || null

          if (identityPlatform) {
            member.identities.push({
              username: contactProperties[hubspotPropertyName],
              platform: identityPlatform,
            })
          }
        } else if (crowdKey === 'organizationName') {
          member.organizations = [
            {
              name: contactProperties[hubspotPropertyName],
            },
          ]
        } else {
          member[crowdKey] = contactProperties[hubspotPropertyName]
        }
      }
    }

    if (hubspotContact.organization) {
      const organization = organizationMapper.getEntity(hubspotContact.organization)
      if (member.organizations && member.organizations.length > 0) {
        member.organizations.push(organization)
      } else {
        member.organizations = [organization]
      }
    }

    return member
  }
}
