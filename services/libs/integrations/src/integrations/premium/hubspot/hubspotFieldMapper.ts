import {
  IMemberAttribute,
  IMemberData,
  IMemberIdentity,
  MemberAttributeName,
  MemberAttributeType,
  PlatformType,
} from '@crowd/types'
import { HubspotPropertyType, IHubspotContact } from './types'

export class HubspotFieldMapper {
  public customAttributes: IMemberAttribute[]

  public identities: IMemberIdentity[]

  public membersTypeMap: Record<string, HubspotPropertyType>

  public membersFieldMap: Record<string, string>

  public hubspotId: number

  constructor(customAttributes?: IMemberAttribute[], identities?: IMemberIdentity[]) {
    if (customAttributes && identities) {
      this.customAttributes = customAttributes
      this.identities = identities
      this.membersTypeMap = this.getMembersHubspotFieldTypeMap()
    }
  }

  public getMembersHubspotFieldTypeMap() {
    const memberFieldsHubspotTypes: Record<string, HubspotPropertyType> = {
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
      // organizations: HubspotPropertyType.???
    }

    for (const customAttribute of this.customAttributes) {
      if (customAttribute.type === MemberAttributeType.BOOLEAN) {
        memberFieldsHubspotTypes[`attributes.${customAttribute.name}`] = HubspotPropertyType.BOOL
      } else if (customAttribute.type === MemberAttributeType.DATE) {
        memberFieldsHubspotTypes[`attributes.${customAttribute.name}`] =
          HubspotPropertyType.DATETIME
      } else if (customAttribute.type === MemberAttributeType.NUMBER) {
        memberFieldsHubspotTypes[`attributes.${customAttribute.name}`] = HubspotPropertyType.NUMBER
      } else if (
        [MemberAttributeType.EMAIL, MemberAttributeType.STRING, MemberAttributeType.URL].includes(
          customAttribute.type,
        )
      ) {
        memberFieldsHubspotTypes[`attributes.${customAttribute.name}`] = HubspotPropertyType.STRING
      }
    }

    for (const identity of this.identities) {
      memberFieldsHubspotTypes[`identities_${identity.platform}`] = HubspotPropertyType.STRING
    }

    return memberFieldsHubspotTypes
  }

  public isFieldMappableToHubspotType(field: string, type: HubspotPropertyType) {
    if (this.membersTypeMap[field] === undefined) {
      throw new Error(`Member attribute ${field} not found!`)
    }

    return this.membersTypeMap[field] === type
  }

  public getCrowdMemberFieldName(hubspotAttributeName: string): string {
    if (!this.membersFieldMap) {
      throw new Error('Members field map is not set!')
    }

    const crowdField = Object.keys(this.membersFieldMap).find(
      (crowdFieldName) => this.membersFieldMap[crowdFieldName] === hubspotAttributeName,
    )

    return crowdField
  }

  public getHubspotMemberFieldName(crowdAttributeName: string): string {
    this.ensureMembersFieldMapExists()

    return this.membersFieldMap[crowdAttributeName]
  }

  public getAllHubspotMemberFields(): string[] {
    this.ensureMembersFieldMapExists()

    return Object.values(this.membersFieldMap)
  }

  public setMembersFieldMap(membersFieldMap: Record<string, string>): void {
    this.membersFieldMap = membersFieldMap
  }

  public setHubspotId(hubspotId: number): void {
    this.hubspotId = hubspotId
  }

  public getMember(hubspotContact: IHubspotContact): IMemberData {
    this.ensureMembersFieldMapExists()

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
      const crowdKey = this.getCrowdMemberFieldName(hubspotPropertyName)

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
        } else {
          member[crowdKey] = contactProperties[hubspotPropertyName]
        }
      }
    }

    return member
  }

  private ensureMembersFieldMapExists(): void {
    if (!this.membersFieldMap) {
      throw new Error('Members field map is not set!')
    }
  }
}
