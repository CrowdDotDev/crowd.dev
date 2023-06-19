import lodash from 'lodash'
import Sequelize from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'

const { Op } = Sequelize

class WidgetRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const record = await options.database.widget.create(
      {
        ...lodash.pick(data, ['cache', 'importHash', 'settings', 'title', 'type']),
        reportId: data.report || null,
        tenantId: tenant.id,
        segmentId: segment.id,
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

  /**
   * Find a widget by type
   * @param type Type of widget to find
   * @param options DB options
   * @returns Widget object
   */
  static async findByType(type, options: IRepositoryOptions) {
    const widgets = await this.findAndCountAll({ filter: { type } }, options)

    if (widgets.count === 0) {
      throw new Error404()
    }

    return widgets.rows[0]
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.widget.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, ['cache', 'importHash', 'settings', 'title', 'type']),
        reportId: data.report || null,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.widget.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
        segmentId: SequelizeRepository.getSegmentIds(options),
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

    const include = [
      {
        model: options.database.report,
        as: 'report',
      },
    ]

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.widget.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
        segmentId: SequelizeRepository.getSegmentIds(options),
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
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    }

    const records = await options.database.widget.findAll({
      attributes: ['id'],
      where,
      transaction,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.widget.count({
      where: {
        ...filter,
        tenantId: tenant.id,
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      transaction,
    })
  }

  static async findAndCountAll(
    { filter = {} as any, advancedFilter = null as any, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const include = [
      {
        model: options.database.report,
        as: 'report',
      },
    ]

    // If the advanced filter is empty, we construct it from the query parameter filter
    if (!advancedFilter) {
      advancedFilter = { and: [] }

      if (filter.id) {
        advancedFilter.and.push({
          id: filter.id,
        })
      }

      if (filter.type) {
        advancedFilter.and.push({
          type: { textContains: filter.type },
        })
      }

      if (filter.title) {
        advancedFilter.and.push({
          title: {
            textContains: filter.title,
          },
        })
      }

      if (filter.report) {
        advancedFilter.and.push({
          reportId: filter.report,
        })
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            createdAt: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            createdAt: {
              lte: end,
            },
          })
        }
      }
    }

    const parser = new QueryParser({}, options)

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['createdAt_DESC'],
      limit,
      offset,
    })

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.widget.findAndCountAll({
      ...(parsed.where ? { where: parsed.where } : {}),
      ...(parsed.having ? { having: parsed.having } : {}),
      order: parsed.order,
      limit: parsed.limit,
      offset: parsed.offset,
      include,
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count, limit: parsed.limit, offset: parsed.offset }
  }

  static async findAllAutocomplete(query, limit, options: IRepositoryOptions) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = [
      {
        tenantId: tenant.id,
      },
      {
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
    ]

    if (query) {
      whereAnd.push({
        [Op.or]: [
          { id: SequelizeFilterUtils.uuid(query) },
          {
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('widget', 'type', query),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.widget.findAll({
      attributes: ['id', 'type'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['type', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.type,
    }))
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
        entityName: 'widget',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
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

export default WidgetRepository
