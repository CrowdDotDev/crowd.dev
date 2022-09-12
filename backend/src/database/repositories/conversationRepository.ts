import lodash from 'lodash'
import Sequelize from 'sequelize'
import { QueryOutput } from './filters/queryTypes'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import { PlatformType } from '../../utils/platforms'
import snakeCaseNames from '../../utils/snakeCaseNames'
import QueryParser from './filters/queryParser'

const Op = Sequelize.Op

class ConversationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.conversation.create(
      {
        ...lodash.pick(data, ['title', 'slug', 'published']),

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

    let record = await options.database.conversation.findOne({
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
        ...lodash.pick(data, ['title', 'slug', 'published']),

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

    const record = await options.database.conversation.findOne({
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

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.conversation.findOne({
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

    const records = await options.database.conversation.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.conversation.count({
      where: {
        ...filter,
        tenantId: tenant.id,
      },
      transaction,
    })
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      advancedFilter = null as any,
      limit = 0,
      offset = 0,
      orderBy = '',
      eagerLoad = [],
    },
    options: IRepositoryOptions,
  ) {
    let customOrderBy: Array<any> = []
    const include = [
      {
        model: options.database.activity,
        as: 'activities',
        attributes: [],
      },
    ]

    const activityCount = options.database.Sequelize.fn(
      'COUNT',
      options.database.Sequelize.col('activities.id'),
    )

    const lastActive = options.database.Sequelize.fn(
      'MAX',
      options.database.Sequelize.col('activities.timestamp'),
    )

    // If the advanced filter is empty, we construct it from the query parameter filter
    if (!advancedFilter) {
      advancedFilter = { and: [] }
      // Filter by ID
      if (filter.id) {
        advancedFilter.and.push({ id: filter.id })
      }

      if (
        filter.published === true ||
        filter.published === 'true' ||
        filter.published === false ||
        filter.published === 'false'
      ) {
        advancedFilter.and.push({
          published: filter.published === true || filter.published === 'true',
        })
      }

      // Filter by title
      if (filter.title) {
        advancedFilter.and.push({
          title: {
            textContains: filter.title,
          },
        })
      }

      // Filter by slug
      if (filter.slug) {
        advancedFilter.and.push({
          slug: {
            like: filter.slug,
          },
        })
      }

      // Filter by createdAtRange
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

      if (filter.platform) {
        advancedFilter.and.push({
          platform: filter.platform,
        })
      }

      if (filter.channel) {
        advancedFilter.and.push({
          channel: { like: filter.channel },
        })
      }

      if (filter.activityCountRange) {
        const [start, end] = filter.activityCountRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            activityCount: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            activityCount: {
              lte: end,
            },
          })
        }
      }

      if (filter.lastActiveRange) {
        const [start, end] = filter.lastActiveRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            lastActive: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            lastActive: {
              lte: end,
            },
          })
        }
      }
    }

    // generate customOrderBy array for ordering Sequelize literals
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('activityCount', orderBy),
    )
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('lastActive', orderBy),
    )
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('platform', orderBy),
    )
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('channel', orderBy),
    )

    const parser = new QueryParser(options, {
      activityCount,
      channel: Sequelize.literal(`"activities"."channel"`),
      lastActive,
      platform: Sequelize.literal(`"activities"."platform"`),
    })

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['createdAt_DESC'],
      limit,
      offset,
    })

    let order = parsed.order

    if (customOrderBy.length > 0) {
      order = [customOrderBy]
    } else if (orderBy) {
      order = [orderBy.split('_')]
    }

    // eslint-disable-next-line prefer-const
    let { rows, count } = await options.database.conversation.findAndCountAll({
      attributes: [
        'id',
        'title',
        'slug',
        'published',
        'createdAt',
        'updatedAt',
        'tenantId',
        'createdById',
        'updatedById',
        [options.database.Sequelize.col('activities.platform'), 'platform'],
        [activityCount, 'activityCount'],
        [lastActive, 'lastActive'],
        [
          Sequelize.literal(
            `MAX(CASE
              WHEN ( "activities"."attributes" ->> 'thread' ) IS NOT NULL AND 
           ( "activities"."attributes" ->> 'thread' ) != 'false' AND
             "activities".platform = '${PlatformType.DISCORD}' THEN
              null
              WHEN ("activities"."channel") IS NOT NULL then
            "activities"."channel"
              ELSE NULL
            END)`,
          ),
          'channel',
        ],
      ],
      ...(parsed.where ? { where: parsed.where } : {}),
      ...(parsed.having ? { having: parsed.having } : {}),
      include,
      order,
      transaction: SequelizeRepository.getTransaction(options),
      group: ['conversation.id', 'activities.platform', 'activities.channel'],
      limit: parsed.limit,
      offset: parsed.offset,
      subQuery: false,
      distinct: true,
    })
    rows = await this._populateRelationsForRows(rows, eagerLoad)
    return { rows, count: count.length }
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
        entityName: 'conversation',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }

  static async _populateRelationsForRows(rows, eagerLoad = []) {
    if (!rows) {
      return rows
    }

    return Promise.all(
      rows.map(async (record) => {
        const rec = record.get({ plain: true })
        for (const relationship of eagerLoad) {
          rec[relationship] = (await record[`get${snakeCaseNames(relationship)}`]()).map((a) =>
            a.get({ plain: true }),
          )
        }
        if (rec.activityCount) {
          rec.activityCount = parseInt(rec.activityCount, 10)
          if (rec.platform && rec.platform === PlatformType.GITHUB) {
            rec.channel = this.extractGitHubRepoPath(rec.channel)
          }
        }
        return rec
      }),
    )
  }

  static extractGitHubRepoPath(url) {
    if (!url) return null
    const match = url.match(/^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/)
    if (!match || !(match.groups?.owner && match.groups?.name)) return null
    return `${match.groups.owner}/${match.groups.name}`
  }

  static async _populateRelations(record, options: IRepositoryOptions) {
    if (!record) {
      return record
    }

    const output = record.get({ plain: true })

    const transaction = SequelizeRepository.getTransaction(options)

    output.activities = await record.getActivities({
      include: ['member'],
      order: [['timestamp', 'ASC']],
      transaction,
    })

    output.activityCount = output.activities.length
    output.platform = null
    output.channel = null
    output.lastActive = null

    if (output.activityCount > 0) {
      output.platform = output.activities[0].platform ?? null
      output.lastActive = output.activities[output.activities.length - 1].timestamp
      output.channel = output.activities[0].channel ? output.activities[0].channel : null
    }

    return output
  }
}

export default ConversationRepository
