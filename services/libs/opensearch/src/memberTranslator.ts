/* eslint-disable class-methods-use-this */

import { IMemberAttribute, MemberAttributeType } from '@crowd/types'
import FieldTranslator from './fieldTranslator'
import { MembersOpensearch } from './models/members'

export default class MemberTranslator extends FieldTranslator {
  memberAttributes: IMemberAttribute[]

  constructor(attributes: IMemberAttribute[], availablePlatforms: string[]) {
    super()

    this.model = new MembersOpensearch()

    this.memberAttributes = attributes

    const fields = this.model.getAllFields()

    // set translations for static fields
    this.translations = Object.keys(fields).reduce((acc, f) => {
      acc[f] = `${fields[f].type}_${f}`
      return acc
    }, {})

    // set translations for dynamic attributes
    for (const attribute of attributes) {
      if (attribute.type === MemberAttributeType.SPECIAL) {
        this.translations[attribute.name] = `string_${attribute.name}`
        this.model.fields[attribute.name] = { type: `string` }
      } else {
        this.translations[attribute.name] = `obj_${attribute.name}`
        this.model.fields[attribute.name] = {
          type: `obj`,
          dynamic: true,
          realType: this.attributeTypeToOpenSearchPrefix(attribute.type),
        }
      }

      // also set reverse translations for platform specific keys
      // like string_github, int_discord etc
      for (const platform of availablePlatforms) {
        const prefix = this.attributeTypeToOpenSearchPrefix(attribute.type)
        this.opensearchToCrowdMap.set(`${prefix}_${platform}`, platform)
      }
    }

    // set translations for joined entity fields that doesn't exist in member model already

    // tags
    this.translations.name = 'string_name'

    // organizations
    this.translations.logo = 'string_logo'
    this.translations.memberOrganizations = 'obj_memberOrganizations'
    this.translations.title = 'string_title'
    this.translations.dateStart = 'date_dateStart'
    this.translations.dateEnd = 'date_dateEnd'

    // identities
    this.translations.platform = 'string_platform'
    this.translations.username = 'string_username'

    this.setTranslationMaps()

    // fix for colliding translations of id -> uuid_memberId (members) and id -> uuid_id (organizations, tags)
    this.opensearchToCrowdMap.set('uuid_id', 'id')

    // backwards compatibility for reach.total
    this.crowdToOpensearchMap.set('reach.total', 'int_totalReach')
  }

  private attributeTypeToOpenSearchPrefix(type: MemberAttributeType): string {
    switch (type) {
      case MemberAttributeType.BOOLEAN:
        return 'bool'
      case MemberAttributeType.NUMBER:
        return 'int'
      case MemberAttributeType.EMAIL:
        return 'string'
      case MemberAttributeType.STRING:
        return 'string'
      case MemberAttributeType.URL:
        return 'string'
      case MemberAttributeType.DATE:
        return 'date'
      case MemberAttributeType.MULTI_SELECT:
        return 'string_arr'
      case MemberAttributeType.SPECIAL:
        return 'string'
      default:
        throw new Error(`Could not map attribute type: ${type} to OpenSearch type!`)
    }
  }

  override crowdToOpensearch(crowdKey: string): string {
    if (this.model.fieldExists(crowdKey)) {
      const field = this.model.getField(crowdKey)

      if (field.dynamic) {
        return this.expandDynamicAttribute(crowdKey)
      }

      return super.crowdToOpensearch(crowdKey)
    }

    if (crowdKey.startsWith('attributes')) {
      return this.expandDynamicAttribute(crowdKey)
    }

    throw new Error(`Unknown filter key: ${crowdKey}`)
  }

  override fieldExists(key: string): boolean {
    return this.model.fieldExists(key) || key.startsWith('attributes')
  }

  expandDynamicAttribute(key: string) {
    const keySplit = key.split('.')

    const actualAttributeName = keySplit.length === 1 ? keySplit[0] : keySplit[1]

    const attribute = this.memberAttributes.find((a) => a.name === actualAttributeName)

    const opensearchType = this.attributeTypeToOpenSearchPrefix(attribute.type)

    if (keySplit.length === 1) {
      return `obj_attributes.obj_${key}.${opensearchType}_default`
    }

    return keySplit.reduce((acc, k, counter) => {
      if (counter === keySplit.length - 1) {
        acc += `${opensearchType}_${k}`
      } else {
        acc += `${this.crowdToOpensearchMap.get(k)}.`
      }
      return acc
    }, '')
  }
}
