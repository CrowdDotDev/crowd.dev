import { Error400 } from '@crowd/common'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import MicroserviceRepository from '../database/repositories/microserviceRepository'
import { sendPythonWorkerMessage } from '../serverless/utils/pythonWorkerSQS'

export default class MicroserviceService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  /**
   * Creates microservice entity with given data
   * @param data object representation of the microservice entity
   * @param forceRunOnCreation if set to true, sqs message is sent
   * to start the created microservice immediately
   * @returns created plain microservice object
   */
  async create(data, forceRunOnCreation = false) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await MicroserviceRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      if (forceRunOnCreation) {
        await sendPythonWorkerMessage(this.options.currentTenant.id, {
          type: data.type,
        })
      }

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'microservice')

      throw error
    }
  }

  /**
   * Create a microservice if it does not exist already. Otherwise, return it.
   * @param data Data for creating the microservice
   * @returns The microservice, either the existing or the created one
   */
  async createIfNotExists(data) {
    const type = data.type
    const existing = await MicroserviceRepository.findAndCountAll(
      { filter: { type }, limit: 1 },
      this.options,
    )
    if (existing.count === 0) {
      return this.create(data)
    }
    return existing.rows[0]
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await MicroserviceRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'microservice')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await MicroserviceRepository.destroy(id, {
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

  async findById(id) {
    return MicroserviceRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return MicroserviceRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return MicroserviceRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return MicroserviceRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
      this.options,
    )
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
    const count = await MicroserviceRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }
}
