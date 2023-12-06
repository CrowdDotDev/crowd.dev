import MemberAttributeSettingsRepository from '../repo/memberAttributeSettings.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { MemberAttributeType } from '@crowd/types'

export default class MemberAttributeService extends LoggerBase {
  private readonly repo: MemberAttributeSettingsRepository

  constructor(store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.repo = new MemberAttributeSettingsRepository(store, parentLog)
  }

  public async setAttributesDefaultValues(
    tenantId: string,
    attributes: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const priorities = await this.repo.getPlatformPriorityArray(tenantId)
    if (!priorities) {
      throw new Error(`No priorities set for tenant '${tenantId}'!`)
    }

    for (const attributeName of Object.keys(attributes)) {
      if (typeof attributes[attributeName] === 'string') {
        try {
          attributes[attributeName] = JSON.parse(attributes[attributeName] as string)
        } catch (error) {
          this.log.error('Failed to parse attribute value', {
            attributeName,
            attributeValue: attributes[attributeName],
          })
        }
      }

      const highestPriorityPlatform =
        MemberAttributeService.getHighestPriorityPlatformForAttributes(
          Object.keys(attributes[attributeName]),
          priorities,
        )

      if (highestPriorityPlatform !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(attributes[attributeName] as any).default =
          attributes[attributeName][highestPriorityPlatform]
      } else {
        delete attributes[attributeName]
      }
    }

    return attributes
  }

  public static getHighestPriorityPlatformForAttributes(
    platforms: string[],
    priorityArray: string[],
  ): string | undefined {
    if (platforms.length <= 0) {
      return undefined
    }
    const filteredPlatforms = priorityArray.filter((i) => platforms.includes(i))
    return filteredPlatforms.length > 0 ? filteredPlatforms[0] : platforms[0]
  }

  public async validateAttributes(
    tenantId: string,
    attributes: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const settings = await this.repo.getMemberAttributeSettings(tenantId)
    const memberAttributeSettings = settings.reduce((acc, attribute) => {
      acc[attribute.name] = attribute
      return acc
    }, {})

    for (const attributeName of Object.keys(attributes)) {
      if (!memberAttributeSettings[attributeName]) {
        this.log.error('Attribute does not exist', {
          attributeName,
          attributes,
        })
        delete attributes[attributeName]
        continue
      }
      if (typeof attributes[attributeName] !== 'object') {
        attributes[attributeName] = {
          custom: attributes[attributeName],
        }
      }

      for (const platform of Object.keys(attributes[attributeName])) {
        if (
          attributes[attributeName][platform] !== undefined &&
          attributes[attributeName][platform] !== null
        ) {
          if (
            !MemberAttributeService.isCorrectType(
              attributes[attributeName][platform],
              memberAttributeSettings[attributeName].type,
              { options: memberAttributeSettings[attributeName].options },
            )
          ) {
            this.log.error('Failed to validate attributee', {
              attributeName,
              platform,
              attributeValue: attributes[attributeName][platform],
              attributeType: memberAttributeSettings[attributeName].type,
            })
            throw new Error(
              `Failed to validate attribute '${attributeName}' with value '${attributes[attributeName][platform]}'!`,
            )
          }
        }
      }
    }

    return attributes
  }

  static isCorrectType(value, type: MemberAttributeType, options?: unknown): boolean {
    switch (type) {
      case MemberAttributeType.BOOLEAN:
        return MemberAttributeService.isBoolean(value)
      case MemberAttributeType.STRING:
        return MemberAttributeService.isString(value)
      case MemberAttributeType.DATE:
        return MemberAttributeService.isDate(value)
      case MemberAttributeType.EMAIL:
        return MemberAttributeService.isEmail(value)
      case MemberAttributeType.URL:
        return MemberAttributeService.isUrl(value)
      case MemberAttributeType.NUMBER:
        return MemberAttributeService.isNumber(value)
      case MemberAttributeType.MULTI_SELECT:
        return MemberAttributeService.isMultiSelect(value, options as unknown[])
      case MemberAttributeType.SPECIAL:
        return true
      default:
        return false
    }
  }

  static isBoolean(value: unknown): boolean {
    return value === true || value === 'true' || value === false || value === 'false'
  }

  static isNumber(value: unknown): boolean {
    return (
      (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
      !isNaN(value as number)
    )
  }

  private static EMAIL_REGEXP = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
  static isEmail(value: unknown): boolean {
    return (
      MemberAttributeService.isString(value) &&
      value !== '' &&
      MemberAttributeService.EMAIL_REGEXP.test(value as string)
    )
  }

  static isString(value: unknown): boolean {
    return typeof value === 'string'
  }

  static isUrl(value: unknown): boolean {
    return MemberAttributeService.isString(value)
  }

  private static DATE_REGEXP =
    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?$/
  static isDate(value: unknown): boolean {
    // Check if value is a Date object
    if (value instanceof Date) {
      return !isNaN(value.getTime())
    }

    // Check if value is a number (milliseconds since Linux epoch)
    if (typeof value === 'number') {
      const dateFromNumber = new Date(value)
      return !isNaN(dateFromNumber.getTime())
    }

    // Check if value is a string and a valid ISO 8601 date
    if (typeof value === 'string') {
      if (MemberAttributeService.DATE_REGEXP.test(value)) {
        const dateFromString = new Date(value)
        return !isNaN(dateFromString.getTime())
      }
    }

    // If none of the conditions above are met, the value is not a valid date
    return false
  }

  static isMultiSelect(values: unknown, options: unknown[]) {
    // Type must be array
    if (!Array.isArray(values)) {
      return false
    }
    // If empty array, it is valid
    if (values.length === 0) {
      return true
    }
    if (!options) {
      return false
    }
    // All values must be in options
    for (const value of values) {
      if (!options.includes(value)) {
        return false
      }
    }
    return true
  }
}
