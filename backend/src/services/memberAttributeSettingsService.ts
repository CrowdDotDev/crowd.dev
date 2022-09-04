import { Attribute } from '../database/attributes/attribute'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import Error400 from '../errors/Error400'
import camelCaseNames from '../utils/camelCaseNames'
import { IServiceOptions } from './IServiceOptions'

export default class MemberAttributeSettingsService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async create(data) {
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

  async createPredefined(attributes: Attribute[]) {
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

  async destroyAll(ids) {
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

  async update(id, data) {
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
        (data.canDelete === true ||
          data.canDelete === 'true' ||
          data.canDelete === false ||
          data.canDelete === 'false') &&
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

  async findAndCountAll(args) {
    return MemberAttributeSettingsRepository.findAndCountAll(args, this.options)
  }

  async findById(id) {
    return MemberAttributeSettingsRepository.findById(id, this.options)
  }
}
