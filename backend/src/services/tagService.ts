import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import TagRepository from '../database/repositories/tagRepository'
import CommunityMemberRepository from '../database/repositories/communityMemberRepository'

export default class TagService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (data.communityMembers) {
        data.communityMembers = await CommunityMemberRepository.filterIdsInTenant(
          data.communityMembers,
          { ...this.options, transaction },
        )
      }

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (data.communityMembers) {
        data.communityMembers = await CommunityMemberRepository.filterIdsInTenant(
          data.communityMembers,
          { ...this.options, transaction },
        )
      }

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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

  async findById(id) {
    return TagRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return TagRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return TagRepository.findAndCountAll(args, this.options)
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.create(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await TagRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }
}
