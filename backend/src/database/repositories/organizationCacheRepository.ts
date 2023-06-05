import lodash from 'lodash'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'

class OrganizationCacheRepository {
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
          'enriched',
          'website',
          'github',
          'location',
          'employeeCountByCountry',
          'type',
          'ticker',
          'headline',
          'profiles',
          'naics',
          'industry',
          'founded',
          'address',
          'size',
          'lastEnrichedAt',
        ]),
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
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
          'enriched',
          'website',
          'github',
          'location',
          'geoLocation',
          'employeeCountByCountry',
          'geoLocation',
          'address',
          'type',
          'ticker',
          'headline',
          'profiles',
          'naics',
          'industry',
          'founded',
          'size',
          'employees',
          'twitter',
          'lastEnrichedAt',
        ]),
      },
      {
        transaction,
      },
    )

    if (!record) {
      throw new Error404()
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async bulkUpdate(data: any[], options: IRepositoryOptions): Promise<void> {
    for (const org of data) {
      this.update(org.id, org, options)
    }
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

  static async findById(id, options: IRepositoryOptions) {
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
    return output
  }

  static async findByUrl(url, options: IRepositoryOptions) {
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
    return output
  }

  static async findByName(name, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        name,
      },
      include,
      transaction,
    })

    if (!record) {
      return undefined
    }

    const output = record.get({ plain: true })
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

export default OrganizationCacheRepository
