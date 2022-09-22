import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import ReportRepository from '../database/repositories/reportRepository'
import WidgetRepository from '../database/repositories/widgetRepository'
import track from '../segment/track'

export default class ReportService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (data.widgets) {
        data.widgets = await WidgetRepository.filterIdsInTenant(data.widgets, {
          ...this.options,
          transaction,
        })
      }

      const record = await ReportRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'report')

      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (data.widgets) {
        data.widgets = await WidgetRepository.filterIdsInTenant(data.widgets, {
          ...this.options,
          transaction,
        })
      }

      const recordBeforeUpdate = await ReportRepository.findById(id, { ...this.options })
      const record = await ReportRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      if (
        (data.published === true || data.published === 'true') &&
        (record.published === true || record.published === 'true') &&
        recordBeforeUpdate.published !== record.published &&
        process.env.NODE_ENV !== 'test'
      ) {
        track('Report Published', { id: record.id }, { ...this.options })
      }

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'report')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      for (const id of ids) {
        await ReportRepository.destroy(
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
    return ReportRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return ReportRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return ReportRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return ReportRepository.findAndCountAll(
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
    const count = await ReportRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }
}
