import lodash from 'lodash'
import Sequelize from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'

const { Op } = Sequelize

const log: boolean = false

class ActivityRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.activity.create(
      {
        ...lodash.pick(data, [
          'type',
          'timestamp',
          'platform',
          'info',
          'crowdInfo',
          'isKeyAction',
          'score',
          'sourceId',
          'importHash',
        ]),
        memberId: data.member || null,
        parentId: data.parent || null,
        sourceParentId: data.sourceParentId || null,
        conversationId: data.conversationId || null,
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

    let record = await options.database.activity.findOne({
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
          'type',
          'timestamp',
          'platform',
          'info',
          'crowdInfo',
          'isKeyAction',
          'score',
          'sourceId',
          'importHash',
        ]),
        memberId: data.member || undefined,
        parentId: data.parent || undefined,
        sourceParentId: data.sourceParentId || undefined,
        conversationId: data.conversationId || undefined,
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

    const record = await options.database.activity.findOne({
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

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = [
      {
        model: options.database.member,
        as: 'member',
      },
      {
        model: options.database.activity,
        as: 'parent',
      },
    ]

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.activity.findOne({
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

  /**
   * Find a record in the database given a query.
   * @param query Query to find by
   * @param options Repository options
   * @returns The found record. Null if none is found.
   */
  static async findOne(query, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.activity.findOne({
      where: {
        tenantId: currentTenant.id,
        ...query,
      },
      transaction,
    })

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

    const records = await options.database.activity.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.activity.count({
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
    const include = [
      {
        model: options.database.member,
        as: 'member',
      },
      {
        model: options.database.activity,
        as: 'parent',
      },
    ]

    whereAnd.push({
      tenantId: tenant.id,
    })

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          id: SequelizeFilterUtils.uuid(filter.id),
        })
      }

      if (filter.type) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('activity', 'type', filter.type))
      }

      if (filter.timestampRange) {
        const [start, end] = filter.timestampRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            timestamp: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            timestamp: {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.platform) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('activity', 'platform', filter.platform))
      }

      if (filter.info) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('activity', 'info', filter.info))
      }

      if (filter.member) {
        whereAnd.push({
          memberId: SequelizeFilterUtils.uuid(filter.member),
        })
      }

      if (filter.crowdInfo) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('activity', 'crowdInfo', filter.crowdInfo))
      }

      if (
        filter.isKeyAction === true ||
        filter.isKeyAction === 'true' ||
        filter.isKeyAction === false ||
        filter.isKeyAction === 'false'
      ) {
        whereAnd.push({
          isKeyAction: filter.isKeyAction === true || filter.isKeyAction === 'true',
        })
      }

      if (filter.scoreRange) {
        const [start, end] = filter.scoreRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            score: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            score: {
              [Op.lte]: end,
            },
          })
        }
      }

      if (filter.parent) {
        whereAnd.push({
          parentId: SequelizeFilterUtils.uuid(filter.parent),
        })
      }

      if (filter.sourceParentId) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludesCaseSensitive(
            'activity',
            'sourceParentId',
            filter.sourceParentId,
          ),
        )
      }

      if (filter.sourceId) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('activity', 'sourceId', filter.sourceId))
      }

      if (filter.conversationId) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('activity', 'conversationId', filter.conversationId),
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
    } = await options.database.activity.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : undefined,
      order: orderBy ? [orderBy.split('_')] : [['timestamp', 'DESC']],
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
        [Op.or]: [{ id: SequelizeFilterUtils.uuid(query) }],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.activity.findAll({
      attributes: ['id', 'id'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['id', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.id,
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
          entityName: 'activity',
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

export default ActivityRepository
