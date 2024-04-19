import { Error400, Error404, RawQueryParser } from '@crowd/common'
import { ActivityDisplayService } from '@crowd/integrations'
import lodash from 'lodash'
import sanitizeHtml from 'sanitize-html'
import Sequelize, { QueryTypes } from 'sequelize'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import SegmentRepository from './segmentRepository'
import SequelizeRepository from './sequelizeRepository'

const { Op } = Sequelize

const log: boolean = false

class ActivityRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    // Data and body will be displayed as HTML. We need to sanitize them.
    if (data.body) {
      data.body = sanitizeHtml(data.body).trim()
    }

    if (data.title) {
      data.title = sanitizeHtml(data.title).trim()
    }

    if (data.sentiment) {
      this._validateSentiment(data.sentiment)
    }

    // type and platform to lowercase
    if (data.type) {
      data.type = data.type.toLowerCase()
    }
    if (data.platform) {
      data.platform = data.platform.toLowerCase()
    }

    const record = await options.database.activity.create(
      {
        ...lodash.pick(data, [
          'type',
          'timestamp',
          'platform',
          'isContribution',
          'score',
          'attributes',
          'channel',
          'body',
          'title',
          'url',
          'sentiment',
          'sourceId',
          'importHash',
          'username',
          'objectMemberUsername',
        ]),
        memberId: data.member || null,
        objectMemberId: data.objectMember || undefined,
        organizationId: data.organizationId || undefined,
        parentId: data.parent || null,
        sourceParentId: data.sourceParentId || null,
        conversationId: data.conversationId || null,
        segmentId: segment.id,
        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await record.setTasks(data.tasks || [], {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  /**
   * Check whether sentiment data is valid
   * @param sentimentData Object: {positive: number, negative: number, mixed: number, neutral: number, sentiment: 'positive' | 'negative' | 'mixed' | 'neutral'}
   */
  static _validateSentiment(sentimentData) {
    if (!lodash.isEmpty(sentimentData)) {
      const moods = ['positive', 'negative', 'mixed', 'neutral']
      for (const prop of moods) {
        if (typeof sentimentData[prop] !== 'number') {
          throw new Error400('en', 'activity.error.sentiment.mood')
        }
      }
      if (!moods.includes(sentimentData.label)) {
        throw new Error400('en', 'activity.error.sentiment.label')
      }
      if (typeof sentimentData.sentiment !== 'number') {
        throw new Error('activity.error.sentiment.sentiment')
      }
    }
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    let record = await options.database.activity.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
        segmentId: segment.id,
      },
      transaction,
    })

    await record.setTasks(data.tasks || [], {
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    // Data and body will be displayed as HTML. We need to sanitize them.
    if (data.body) {
      data.body = sanitizeHtml(data.body).trim()
    }
    if (data.title) {
      data.title = sanitizeHtml(data.title).trim()
    }

    if (data.sentiment) {
      this._validateSentiment(data.sentiment)
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'type',
          'timestamp',
          'platform',
          'isContribution',
          'attributes',
          'channel',
          'body',
          'title',
          'url',
          'sentiment',
          'score',
          'sourceId',
          'importHash',
          'username',
          'objectMemberUsername',
        ]),
        memberId: data.member || undefined,
        objectMemberId: data.objectMember || undefined,
        organizationId: data.organizationId,
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

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.activity.findOne({
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
        model: options.database.member,
        as: 'member',
      },
      {
        model: options.database.member,
        as: 'objectMember',
      },
      {
        model: options.database.activity,
        as: 'parent',
      },
      {
        model: options.database.organization,
        as: 'organization',
      },
    ]

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.activity.findOne({
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

    return this._populateRelations(record, true, options)
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
        segmentId: SequelizeRepository.getSegmentIds(options),
        ...query,
      },
      transaction,
    })

    return this._populateRelations(record, true, options)
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids, options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    }

    const records = await options.database.activity.findAll({
      attributes: ['id'],
      where,
      transaction,
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
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      transaction,
    })
  }

  public static ACTIVITY_QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
    ['isTeamMember', "coalesce((m.attributes -> 'isTeamMember' -> 'default')::boolean, false)"],
    ['isBot', "coalesce((m.attributes -> 'isBot' -> 'default')::boolean, false)"],
    ['platform', 'a.platform'],
    ['type', 'a.type'],
    ['channel', 'a.channel'],
    ['timestamp', 'a.timestamp'],
    ['memberId', 'a."memberId"'],
    ['organizationId', 'a."organizationId"'],
    ['conversationId', 'a."conversationId"'],
    ['sentiment', 'a."sentimentMood"'],
  ])

  static async findAndCountAllv2(
    { filter = {} as any, limit = 20, offset = 0, orderBy = [''], countOnly = false },
    options: IRepositoryOptions,
  ) {
    if (orderBy.length === 0 || (orderBy.length === 1 && orderBy[0].trim().length === 0)) {
      orderBy = ['timestamp_DESC']
    }

    const tenant = SequelizeRepository.getCurrentTenant(options)
    const segmentIds = SequelizeRepository.getSegmentIds(options)
    const seq = SequelizeRepository.getSequelize(options)

    const params: any = {
      tenantId: tenant.id,
      segmentIds,
      limit,
      offset,
    }

    if (filter.member) {
      if (filter.member.isTeamMember) {
        filter.isTeamMember = filter.member.isTeamMember
      }

      if (filter.member.isBot) {
        filter.isBot = filter.member.isBot
      }

      delete filter.member
    }

    const parsedOrderBys = []

    for (const orderByPart of orderBy) {
      const orderByParts = orderByPart.split('_')
      const direction = orderByParts[1].toLowerCase()
      switch (orderByParts[0]) {
        case 'timestamp':
          parsedOrderBys.push({
            property: orderByParts[0],
            column: 'a.timestamp',
            direction,
          })
          break
        case 'createdAt':
          parsedOrderBys.push({
            property: orderByParts[0],
            column: 'a."createdAt"',
            direction,
          })
          break

        default:
          throw new Error(`Invalid order by: ${orderByPart}!`)
      }
    }

    const orderByString = parsedOrderBys.map((o) => `${o.column} ${o.direction}`).join(',')

    let filterString = RawQueryParser.parseFilters(
      filter,
      ActivityRepository.ACTIVITY_QUERY_FILTER_COLUMN_MAP,
      [],
      params,
    )

    if (filterString.trim().length === 0) {
      filterString = '1=1'
    }

    const baseQuery = `
      from mv_activities_cube a
      inner join members m on m.id = a."memberId"
      where a."tenantId" = :tenantId
      and a."segmentId" in (:segmentIds)
      and ${filterString}
    `

    const countQuery = `
    select count(a.id) as count
    ${baseQuery}
    `

    if (countOnly) {
      const countResults = (await seq.query(countQuery, {
        replacements: params,
        type: QueryTypes.SELECT,
      })) as any

      const count = countResults[0].count

      return {
        rows: [],
        count,
        limit,
        offset,
      }
    }

    const query = `
      select a.id
      ${baseQuery}
      order by ${orderByString}
      limit :limit offset :offset
    `

    const [results, countResults] = await Promise.all([
      seq.query(query, {
        replacements: params,
        type: QueryTypes.SELECT,
      }),
      seq.query(countQuery, {
        replacements: params,
        type: QueryTypes.SELECT,
      }),
    ])

    const count = (countResults[0] as any).count
    const ids = (results as any).map((r) => r.id)

    const include = [
      {
        model: options.database.member,
        as: 'member',
      },
      {
        model: options.database.activity,
        as: 'parent',
        include: [
          {
            model: options.database.member,
            as: 'member',
          },
        ],
      },
      {
        model: options.database.member,
        as: 'objectMember',
      },
      {
        model: options.database.organization,
        as: 'organization',
      },
    ]

    const order = parsedOrderBys.map((a) => [a.property, a.direction])

    let rows = await options.database.activity.findAll({
      include,
      attributes: [
        ...SequelizeFilterUtils.getLiteralProjectionsOfModel('activity', options.database),
      ],
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      order,
    })

    rows = await this._populateRelationsForRows(rows, false, options)

    return {
      rows,
      count,
      limit,
      offset,
    }
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

  static async _populateRelationsForRows(rows, loadTasks: boolean, options: IRepositoryOptions) {
    if (!rows) {
      return rows
    }

    return Promise.all(rows.map((record) => this._populateRelations(record, loadTasks, options)))
  }

  static async _populateRelations(record, loadTasks: boolean, options: IRepositoryOptions) {
    if (!record) {
      return record
    }
    const transaction = SequelizeRepository.getTransaction(options)

    const output = record.get({ plain: true })

    output.display = ActivityDisplayService.getDisplayOptions(
      record,
      SegmentRepository.getActivityTypes(options),
    )

    if (output.parent) {
      output.parent.display = ActivityDisplayService.getDisplayOptions(
        output.parent,
        SegmentRepository.getActivityTypes(options),
      )
    }

    if (loadTasks) {
      output.tasks = await record.getTasks({
        transaction,
        joinTableAttributes: [],
      })
    }

    return output
  }
}

export default ActivityRepository
