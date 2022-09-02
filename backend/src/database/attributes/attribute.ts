import Error400 from '../../errors/Error400'
import { AttributeType } from './types'

export class Attribute {
  type: AttributeType

  canDelete: boolean

  show: boolean

  label: string

  name: string

  /**
   * Checks if the given value matches the attribute type
   * Throws wrong type error if types do not match
   * @param attribute
   * @param value
   */
  static isCorrectType(attribute: Attribute, value: any): boolean {
    if (typeof value !== attribute.type) {
      throw new Error400(
        'en',
        'settings.memberAttributes.errors.wrongType',
        attribute.name,
        attribute.type,
        typeof value,
      )
    }

    return true
  }
}
