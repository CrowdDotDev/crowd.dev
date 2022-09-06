import lodash from 'lodash'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'

class organizationCacheRepository {
  static async create(data, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.organizationCache.create(
      {
        ...lodash.pick(data, [
          'name',
          'url',
          'description',
          'parentUrl',
          'emails',
          'phoneNumbers',
          'logo',
          'tags',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'revenueRange',
          'importHash',
        ]),
      },
      {
        transaction,
      },
    )

    await record.setOrganizationsSeeded(data.organizationsSeeded, {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  /**
   * Add a list of seeded organizations IDs to the cache relation.
   * @param url If of the cached organization
   * @param data List of IDs of organizations to be added to the cache
   * @param options IRepositoryOptions
   * @returns The updated organization cache record, with the organizationsSeeded field filled
   */
  static async addOrganizationsSeeded(url, data: [string], options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.organizationCache.findOne({
      where: {
        url,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    const currentSeeded = (
      await record.getOrganizationsSeeded({
        transaction,
      })
    ).map((record) => record.id)

    await record.setOrganizationsSeeded([...currentSeeded, ...data], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options, true)
  }

  static async update(id, data, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'name',
          'url',
          'description',
          'parentUrl',
          'emails',
          'phoneNumbers',
          'logo',
          'tags',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'revenueRange',
          'importHash',
        ]),
      },
      {
        transaction,
      },
    )

    await record.setOrganizationsSeeded(data.organizationsSeeded || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      transaction,
      force,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions, fillRelations = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }
    const output = record.get({ plain: true })
    if (fillRelations) {
      output.organizationsSeeded = (
        await record.getOrganizationsSeeded({
          transaction,
        })
      ).map((record) => record.id)
    }
    return output
  }

  static async findByUrl(url, options: IRepositoryOptions, fillRelations = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        url,
      },
      include,
      transaction,
    })

    if (!record) {
      return undefined
    }

    const output = record.get({ plain: true })
    if (fillRelations) {
      output.organizationsSeeded = (
        await record.getOrganizationsSeeded({
          transaction,
        })
      ).map((record) => record.id)
    }
    return output
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = {
        ...record.get({ plain: true }),
      }
    }

    await AuditLogRepository.log(
      {
        entityName: 'organizationCache',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }
}

export default organizationCacheRepository
