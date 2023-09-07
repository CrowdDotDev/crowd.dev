/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  IMemberAttribute,
  IMemberData,
  MemberAttributeName,
  MemberAttributeType,
  PlatformType,
  ITagOpensearch,
  IOrganizationCreateData,
} from '@crowd/types'
import { HubspotPropertyType, IFieldProperty, IHubspotContact } from '../types'
import { HubspotFieldMapper } from './hubspotFieldMapper'
import { HubspotOrganizationFieldMapper } from './organizationFieldMapper'
import { serializeArray, serializeDate } from './utils/serialization'

export class HubspotMemberFieldMapper extends HubspotFieldMapper {
  protected fieldProperties: Record<string, IFieldProperty> = {
    displayName: {
      hubspotType: HubspotPropertyType.STRING,
    },
    score: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    lastEnriched: {
      hubspotType: HubspotPropertyType.DATE,
      readonly: true,
      serialize: serializeDate,
    },
    emails: {
      hubspotType: HubspotPropertyType.STRING,
      serialize: serializeArray,
    },
    joinedAt: {
      hubspotType: HubspotPropertyType.DATE,
      readonly: true,
      serialize: serializeDate,
    },
    createdAt: {
      hubspotType: HubspotPropertyType.DATE,
      readonly: true,
      serialize: serializeDate,
    },
    reach: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    numberOfOpensourceContributions: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    activityCount: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    activeDaysCount: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    lastActive: {
      hubspotType: HubspotPropertyType.DATE,
      readonly: true,
      serialize: serializeDate,
    },
    averageSentiment: {
      hubspotType: HubspotPropertyType.NUMBER,
      readonly: true,
    },
    tags: {
      hubspotType: HubspotPropertyType.STRING,
      readonly: true,
      serialize: (tags: ITagOpensearch[]) => {
        return tags.map((t) => t.name).toString()
      },
    },
    organizationName: {
      hubspotType: HubspotPropertyType.STRING,
    },
  }

  public customAttributes: IMemberAttribute[]

  public platforms: string[]

  constructor(hubspotId: number, customAttributes: IMemberAttribute[], platforms: string[]) {
    super(hubspotId)

    this.customAttributes = customAttributes
    this.platforms = platforms
    this.fieldProperties = this.getFieldProperties(customAttributes, platforms)
  }

  getFieldProperties(
    customAttributes: IMemberAttribute[],
    platforms: string[],
  ): Record<string, IFieldProperty> {
    const dynamicProperties = this.getDynamicFieldProperties(customAttributes, platforms)
    return { ...this.fieldProperties, ...dynamicProperties }
  }

  getDynamicFieldProperties(
    customAttributes: IMemberAttribute[],
    platforms: string[],
  ): Record<string, IFieldProperty> {
    const dynamicFieldProperties: Record<string, IFieldProperty> = {}

    for (const customAttribute of customAttributes.filter((a) => a.show)) {
      if (customAttribute.type === MemberAttributeType.BOOLEAN) {
        dynamicFieldProperties[`attributes.${customAttribute.name}`] = {
          hubspotType: HubspotPropertyType.BOOL,
        }
      } else if (customAttribute.type === MemberAttributeType.DATE) {
        dynamicFieldProperties[`attributes.${customAttribute.name}`] = {
          hubspotType: HubspotPropertyType.DATE,
        }
      } else if (customAttribute.type === MemberAttributeType.NUMBER) {
        dynamicFieldProperties[`attributes.${customAttribute.name}`] = {
          hubspotType: HubspotPropertyType.NUMBER,
        }
      } else if (
        [MemberAttributeType.EMAIL, MemberAttributeType.STRING, MemberAttributeType.URL].includes(
          customAttribute.type,
        )
      ) {
        dynamicFieldProperties[`attributes.${customAttribute.name}`] = {
          hubspotType: HubspotPropertyType.STRING,
        }
      }
    }

    for (const platform of platforms) {
      dynamicFieldProperties[`identities.${platform}`] = {
        hubspotType: HubspotPropertyType.STRING,
      }
    }

    return dynamicFieldProperties
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

    // staticly defined member fields
    const member: IMemberData = {
      emails: [contactProperties.email],
      identities: [
        {
          platform: PlatformType.HUBSPOT,
          username: contactProperties.email,
          sourceId: hubspotContact.id,
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

      // discard readonly fields, readonly fields will be only used when pushing data back to hubspot
      if (crowdKey && !this.fieldProperties[crowdKey].readonly) {
        // For incoming integrations, we already get the member email from hubspot defined field `email`
        // if user mapped crowd field `emails` to some other field
        // this will be saved to the mapped field when sending the member back to hubspot
        if (crowdKey !== 'emails' && contactProperties[hubspotPropertyName] !== null) {
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
                identities: [
                  {
                    name: contactProperties[hubspotPropertyName],
                    platform: PlatformType.HUBSPOT,
                  },
                ],
              },
            ]
          } else {
            member[crowdKey] = contactProperties[hubspotPropertyName]
          }
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
