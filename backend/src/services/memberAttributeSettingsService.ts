/* eslint-disable no-restricted-globals */
import moment from 'moment'
import { Attribute, AttributeData } from '../database/attributes/attribute'
import { AttributeType } from '../database/attributes/types'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import {
  MemberAttributeSettingsCreateData,
  MemberAttributeSettingsUpdateData,
  MemberAttributeSettingsCriteria,
  MemberAttributeSettingsCriteriaResult,
} from '../database/repositories/types/memberAttributeSettingsTypes'
import Error400 from '../errors/Error400'
import camelCaseNames from '../utils/camelCaseNames'
import { IServiceOptions } from './IServiceOptions'

export default class MemberAttributeSettingsService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  /**
   * Cherry picks attributes from predefined integration attributes.
   * @param names array of names to cherry pick
   * @param attributes list of attributes to cherry pick from
   * @returns
   */
  static pickAttributes(names: string[], attributes: Attribute[]): Attribute[] {
    return attributes.filter((i) => names.includes(i.name))
  }

  static isBoolean(value): boolean {
    return value === true || value === 'true' || value === false || value === 'false'
  }

  static isNumber(value): boolean {
    return (
      (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
      !isNaN(value as number)
    )
  }

  static isEmail(value): boolean {
    const emailRegexp = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
    return (
      MemberAttributeSettingsService.isString(value) && value !== '' && value.match(emailRegexp)
    )
  }

  static isString(value): boolean {
    return typeof value === 'string'
  }

  static isUrl(value): boolean {
    return MemberAttributeSettingsService.isString(value)
  }

  static isDate(value): boolean {
    if (moment(value, moment.ISO_8601).isValid()) {
      return true
    }

    return false
  }

  /**
   * Checks the given attribute value against the attribute type.
   * @param value the value to be checked
   * @param type the type value will be checked against
   * @returns
   */
  static isCorrectType(value, type: AttributeType): boolean {
    switch (type) {
      case AttributeType.BOOLEAN:
        return MemberAttributeSettingsService.isBoolean(value)
      case AttributeType.STRING:
        return MemberAttributeSettingsService.isString(value)
      case AttributeType.DATE:
        return MemberAttributeSettingsService.isDate(value)
      case AttributeType.EMAIL:
        return MemberAttributeSettingsService.isEmail(value)
      case AttributeType.URL:
        return MemberAttributeSettingsService.isUrl(value)
      case AttributeType.NUMBER:
        return MemberAttributeSettingsService.isNumber(value)
      default:
        return false
    }
  }

  async create(data: MemberAttributeSettingsCreateData): Promise<AttributeData> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      data.name = data.name ?? camelCaseNames(data.label)

      const record = await MemberAttributeSettingsRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(
        error,
        this.options.language,
        'memberAttributeSettings',
      )

      throw error
    }
  }

  /**
   * Creates predefined set of attributes in one function call.
   * Useful when creating predefined platform specific attributes that come
   * from the integrations.
   * @param attributes List of attributes
   * @returns created attributes
   */
  async createPredefined(attributes: Attribute[]): Promise<AttributeData[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      const created = []
      for (const attribute of attributes) {
        // check attribute already exists
        const existing = await MemberAttributeSettingsRepository.findAndCountAll(
          { filter: { name: attribute.name } },
          this.options,
        )
        if (existing.count === 0) {
          created.push(
            await MemberAttributeSettingsRepository.create(attribute, {
              ...this.options,
              transaction,
            }),
          )
        } else {
          created.push(existing.rows[0])
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      return created
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(
        error,
        this.options.language,
        'memberAttributeSettings',
      )

      throw error
    }
  }

  async destroyAll(ids: string[]): Promise<void> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      for (const id of ids) {
        await MemberAttributeSettingsRepository.destroy(id, {
          ...this.options,
          transaction,
        })
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async update(id: string, data: MemberAttributeSettingsUpdateData): Promise<AttributeData> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      const attribute = await MemberAttributeSettingsRepository.findById(id, {
        ...this.options,
        transaction,
      })

      // we're not allowing updating attribute type to some other value
      if (data.type && attribute.type !== data.type) {
        throw new Error400(
          this.options.language,
          'settings.memberAttributes.errors.typesNotMatching',
        )
      }

      // readonly canDelete field can't be updated to some other value
      if (
        (data.canDelete === true || data.canDelete === false) &&
        attribute.canDelete !== data.canDelete
      ) {
        throw new Error400(
          this.options.language,
          'settings.memberAttributes.errors.canDeleteReadonly',
        )
      }

      // not allowing updating name field as well, delete just in case if name != data.name
      delete data.name

      const record = await MemberAttributeSettingsRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(
        error,
        this.options.language,
        'memberAttributeSettings',
      )

      throw error
    }
  }

  async findAndCountAll(
    args: MemberAttributeSettingsCriteria,
  ): Promise<MemberAttributeSettingsCriteriaResult> {
    return MemberAttributeSettingsRepository.findAndCountAll(args, this.options)
  }

  async findById(id: string): Promise<AttributeData> {
    return MemberAttributeSettingsRepository.findById(id, this.options)
  }
}
