import SequelizeRepository from '../database/repositories/sequelizeRepository'
import TagRepository from '../database/repositories/tagRepository'

import { IServiceOptions } from './IServiceOptions'

export default class TagService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await TagRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'tag')

      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await TagRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'tag')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await TagRepository.destroy(
          id,
          {
            ...this.options,
            transaction,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await TagRepository.destroyBulk(
        ids,
        {
          ...this.options,
          transaction,
        },
        true,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return TagRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return TagRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return TagRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return TagRepository.findAndCountAll({ advancedFilter, orderBy, limit, offset }, this.options)
  }
}
