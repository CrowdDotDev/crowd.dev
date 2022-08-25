import lodash from 'lodash'
import Sequelize from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'

const { Op } = Sequelize
const log: boolean = false

class IntegrationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.integration.create(
      {
        ...lodash.pick(data, [
          'platform',
          'status',
          'limitCount',
          'limitLastResetAt',
          'token',
          'refreshToken',
          'settings',
          'integrationIdentifier',
          'importHash',
        ]),

        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.integration.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'platform',
          'status',
          'limitCount',
          'limitLastResetAt',
          'token',
          'refreshToken',
          'settings',
          'integrationIdentifier',
          'importHash',
        ]),

        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.integration.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findByPlatform(platform, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.integration.findOne({
      where: {
        platform,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  /**
   * Find all active integrations for a platform
   * @param platform The platform we want to find all active integrations for
   * @returns All active integrations for the platform
   */
  static async findAllActive(platform: string): Promise<Array<Object>> {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const records = await options.database.integration.findAll({
      where: {
        status: 'done',
        platform,
      },
    })

    if (!records) {
      throw new Error404()
    }

    return Promise.all(records.map((record) => this._populateRelations(record)))
  }

  /**
   * Find an integration using the integration identifier and a platform.
   * Tenant not needed.
   * @param identifier The integration identifier
   * @returns The integration object
   */
  // TODO: Test
  static async findByIdentifier(identifier: string, platform: string): Promise<Array<Object>> {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const record = await options.database.integration.findOne({
      where: {
        integrationIdentifier: identifier,
        platform,
      },
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.integration.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids, options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    }

    const records = await options.database.integration.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.integration.count({
      where: {
        ...filter,
        tenantId: tenant.id,
      },
      transaction,
    })
  }

  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = []
    const include = []

    whereAnd.push({
      tenantId: tenant.id,
    })

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          id: SequelizeFilterUtils.uuid(filter.id),
        })
      }

      if (filter.platform) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('integration', 'platform', filter.platform),
        )
      }

      if (filter.status) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('integration', 'status', filter.status))
      }

      if (filter.limitCountRange) {
        const [start, end] = filter.limitCountRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            limitCount: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            limitCount: {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.limitLastResetAtRange) {
        const [start, end] = filter.limitLastResetAtRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            limitLastResetAt: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            limitLastResetAt: {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.token) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('integration', 'token', filter.token))
      }

      if (filter.refreshToken) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('integration', 'refreshToken', filter.refreshToken),
        )
      }

      if (filter.settings) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('integration', 'settings', filter.settings),
        )
      }

      if (filter.integrationIdentifier) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'integration',
            'integrationIdentifier',
            filter.integrationIdentifier,
          ),
        )
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            createdAt: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            createdAt: {
              [Op.lte]: end,
            },
          })
        }
      }
    }

    const where = { [Op.and]: whereAnd }

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.integration.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy ? [orderBy.split('_')] : [['createdAt', 'DESC']],
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count }
  }

  static async findAllAutocomplete(query, limit, options: IRepositoryOptions) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = [
      {
        tenantId: tenant.id,
      },
    ]

    if (query) {
      whereAnd.push({
        [Op.or]: [
          { id: SequelizeFilterUtils.uuid(query) },
          {
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('integration', 'platform', query),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.integration.findAll({
      attributes: ['id', 'platform'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['platform', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.platform,
    }))
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    if (log) {
      let values = {}

      if (data) {
        values = {
          ...record.get({ plain: true }),
        }
      }

      await AuditLogRepository.log(
        {
          entityName: 'integration',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }

  static async _populateRelationsForRows(rows) {
    if (!rows) {
      return rows
    }

    return Promise.all(rows.map((record) => this._populateRelations(record)))
  }

  static async _populateRelations(record) {
    if (!record) {
      return record
    }

    const output = record.get({ plain: true })

    return output
  }
}

export default IntegrationRepository
