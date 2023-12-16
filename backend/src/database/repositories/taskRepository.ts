import sanitizeHtml from 'sanitize-html'
import lodash from 'lodash'
import Sequelize from 'sequelize'
import { Error404 } from '@crowd/common'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'

const { Op } = Sequelize

class TaskRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    if (data.body) {
      data.body = sanitizeHtml(data.body).trim()
    }

    const record = await options.database.task.create(
      {
        ...lodash.pick(data, ['name', 'body', 'type', 'status', 'dueDate', 'importHash']),

        tenantId: tenant.id,
        segmentId: segment.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await record.setMembers(data.members || [], {
      transaction,
    })
    await record.setActivities(data.activities || [], {
      transaction,
    })

    await record.setAssignees(data.assignees || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async createSuggestedTasks(options: IRepositoryOptions) {
    const fs = require('fs')
    const path = require('path')

    const suggestedTasks = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../initializers/suggested-tasks.json'), 'utf8'),
    )

    for (const suggestedTask of suggestedTasks) {
      await TaskRepository.create({ ...suggestedTask, type: 'suggested' }, options)
    }
  }

  static async updateBulk(ids, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const records = await options.database.task.update(
      { ...data, updatedById: currentUser.id },
      {
        where: {
          id: ids,
          tenantId: currentTenant.id,
          segmentId: SequelizeRepository.getSegmentIds(options),
        },
        transaction,
      },
    )

    return { rowsUpdated: records[0] }
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.task.findOne({
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

    if (data.body) {
      data.body = sanitizeHtml(data.body).trim()
    }

    record = await record.update(
      {
        ...lodash.pick(data, ['name', 'body', 'status', 'type', 'dueDate', 'importHash']),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    if (data.members) {
      await record.setMembers(data.members, {
        transaction,
      })
    }

    if (data.activities) {
      await record.setActivities(data.activities, {
        transaction,
      })
    }

    if (data.assignees) {
      await record.setAssignees(data.assignees, {
        transaction,
      })
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.task.findOne({
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

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.task.findOne({
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

    return this._populateRelations(record, options)
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

    const records = await options.database.task.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.task.count({
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
    const include = []

    // If the advanced filter is empty, we construct it from the query parameter filter
    if (!advancedFilter) {
      advancedFilter = { and: [] }

      if (filter.id) {
        advancedFilter.and.push({
          id: filter.id,
        })
      }

      if (filter.name) {
        advancedFilter.and.push({
          name: {
            textContains: filter.name,
          },
        })
      }

      if (filter.body) {
        advancedFilter.and.push({
          body: {
            textContains: filter.body,
          },
        })
      }

      if (filter.type) {
        advancedFilter.and.push({
          type: {
            textContains: filter.type,
          },
        })
      }

      if (filter.status) {
        advancedFilter.and.push({
          status: filter.status,
        })
      }

      if (filter.dueDateRange) {
        const [start, end] = filter.dueDateRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            dueDate: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            dueDate: {
              lte: end,
            },
          })
        }
      }

      if (filter.assignees) {
        advancedFilter.and.push({
          assignees: filter.assignees,
        })
      }

      if (filter.members) {
        advancedFilter.and.push({
          members: filter.members,
        })
      }

      if (filter.activities) {
        advancedFilter.and.push({
          activities: filter.activities,
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

    const parser = new QueryParser(
      {
        manyToMany: {
          members: {
            table: 'tasks',
            model: 'task',
            relationTable: {
              name: 'memberTasks',
              from: 'taskId',
              to: 'memberId',
            },
          },
          assignees: {
            table: 'tasks',
            model: 'task',
            relationTable: {
              name: 'taskAssignees',
              from: 'taskId',
              to: 'userId',
            },
          },
          activities: {
            table: 'tasks',
            model: 'task',
            relationTable: {
              name: 'activityTasks',
              from: 'taskId',
              to: 'activityId',
            },
          },
        },
      },
      options,
    )

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['createdAt_DESC'],
      limit,
      offset,
    })

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.task.findAndCountAll({
      ...(parsed.where ? { where: parsed.where } : {}),
      ...(parsed.having ? { having: parsed.having } : {}),
      order: parsed.order,
      limit: parsed.limit,
      offset: parsed.offset,
      include,
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows, options)

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
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('task', 'name', query),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.task.findAll({
      attributes: ['id', 'name'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['name', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.name,
    }))
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = {
        ...record.get({ plain: true }),
        memberIds: data.members,
      }
    }

    await AuditLogRepository.log(
      {
        entityName: 'task',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }

  static async _populateRelationsForRows(rows, options: IRepositoryOptions) {
    if (!rows) {
      return rows
    }

    return Promise.all(rows.map((record) => this._populateRelations(record, options)))
  }

  static async _populateRelations(record, options: IRepositoryOptions) {
    if (!record) {
      return record
    }

    const output = record.get({ plain: true })

    const transaction = SequelizeRepository.getTransaction(options)

    output.members = await record.getMembers({
      transaction,
      joinTableAttributes: [],
    })

    output.activities = await record.getActivities({
      transaction,
      joinTableAttributes: [],
    })

    output.assignees = (
      await record.getAssignees({
        transaction,
        joinTableAttributes: [],
        raw: true,
      })
    ).map((a) => ({ id: a.id, avatarUrl: null, fullName: a.fullName, email: a.email }))

    return output
  }
}

export default TaskRepository
