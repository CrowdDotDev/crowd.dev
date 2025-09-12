import lodash, { uniq } from 'lodash'
import sanitizeHtml from 'sanitize-html'
import Sequelize, { QueryTypes } from 'sequelize'

import { Error400, Error404, RawQueryParser } from '@crowd/common'
import {
  IQueryActivitiesParameters,
  insertActivities,
  queryActivities,
  updateActivity,
} from '@crowd/data-access-layer'
import { findManyLfxMemberships } from '@crowd/data-access-layer/src/lfx_memberships'
import { ActivityDisplayService } from '@crowd/integrations'
import { IIntegrationResult, IntegrationResultState } from '@crowd/types'

import { QUEUE_CLIENT } from '@/serverless/utils/queueService'

import { AttributeData } from '../attributes/attribute'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'

import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'
import MemberRepository from './memberRepository'
import SegmentRepository from './segmentRepository'
import SequelizeRepository from './sequelizeRepository'

const { Op } = Sequelize

const log: boolean = false

class ActivityRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

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

    const ids = await insertActivities(QUEUE_CLIENT(), [
      {
        type: data.type,
        timestamp: data.timestamp,
        isContribution: data.isContribution,
        score: data.score,
        parentId: data.parent || undefined,
        sourceId: data.sourceId,
        sourceParentId: data.sourceParentId || undefined,
        segmentId: segment.id,
        memberId: data.member || undefined,
        username: data.username,
        objectMemberId: data.objectMember || undefined,
        objectMemberUsername: data.objectMemberUsername,
        sentiment: data.sentiment,
        attributes: data.attributes,
        body: data.body,
        title: data.title,
        channel: data.channel,
        url: data.url,
        organizationId: data.organizationId || undefined,
        platform: data.platform,
        conversationId: data.conversationId || undefined,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
    ])

    if (ids.length !== 1) {
      throw new Error('Activity was not created!')
    }

    const record = await this.findById(ids[0], options)

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return record
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

  static async update(id: string, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

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

    const record = await this.findById(id, options)

    await updateActivity(options.qdb, id, {
      type: data.type,
      isContribution: data.isContribution,
      score: data.score,
      parentId: data.parent || undefined,
      sourceId: data.sourceId,
      sourceParentId: data.sourceParentId || undefined,
      segmentId: segment.id,
      memberId: data.member || undefined,
      username: data.username,
      objectMemberId: data.objectMember || undefined,
      objectMemberUsername: data.objectMemberUsername,
      sentiment: data.sentiment,
      attributes: data.attributes,
      body: data.body,
      title: data.title,
      channel: data.channel,
      url: data.url,
      organizationId: data.organizationId,
      platform: data.platform,
      conversationId: data.conversationId || undefined,
      updatedById: currentUser.id,
    })

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async findById(id: string, options: IRepositoryOptions, loadChildren = true) {
    const segmentIds = SequelizeRepository.getSegmentIds(options)

    const qx = SequelizeRepository.getQueryExecutor(options)
    const activityTypes = SegmentRepository.getActivityTypes(options)

    const results = await queryActivities(
      options.qdb,
      {
        filter: {
          and: [{ id: { eq: id } }],
        },
        segmentIds,
        limit: 1,
      },
      [],
      qx,
      activityTypes,
    )

    if (results.rows.length === 0) {
      throw new Error404(`Activity with id ${id} is not found!`)
    }

    if (loadChildren) {
      return this._populateRelations(results.rows[0], options)
    }

    return this._populateRelations(results.rows[0], options)
  }

  /**
   * Find a record in the database given a query.
   * @param query Query to find by
   * @param options Repository options
   * @returns The found record. Null if none is found.
   */
  static async findOne(
    arg: IQueryActivitiesParameters,
    options: IRepositoryOptions,
  ): Promise<any | null> {
    const segmentIds = SequelizeRepository.getSegmentIds(options)

    const qx = SequelizeRepository.getQueryExecutor(options)
    const activityTypes = SegmentRepository.getActivityTypes(options)

    arg.limit = 1
    arg.segmentIds = segmentIds
    arg.groupBy = null

    const results = await queryActivities(options.qdb, arg, [], qx, activityTypes)

    if (results.rows.length === 0) {
      return null
    }

    return this._populateRelations(results.rows[0], options)
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), '[0]', null)
  }

  static async filterIdsInTenant(ids: string[], options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return []
    }

    const qx = SequelizeRepository.getQueryExecutor(options)
    const activitiyTypes = SegmentRepository.getActivityTypes(options)

    const records = await queryActivities(
      options.qdb,
      {
        filter: {
          and: [{ id: { in: ids } }],
        },
        segmentIds: SequelizeRepository.getSegmentIds(options),
        limit: ids.length,
      },
      ['id'],
      qx,
      activitiyTypes,
    )

    return records.rows.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    return options.database.activity.count({
      where: {
        ...filter,
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

    const segmentIds = SequelizeRepository.getSegmentIds(options)
    const seq = SequelizeRepository.getSequelize(options)

    const params: any = {
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
      where a."segmentId" in (:segmentIds)
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

    rows = await this._populateRelationsForRows(rows, options)

    const organizationIds = uniq(rows.map((r) => r.organizationId))
    const qx = SequelizeRepository.getQueryExecutor(options)
    const lfxMemberships = await findManyLfxMemberships(qx, {
      organizationIds,
    })

    rows.forEach((r) => {
      if (!r.organization) {
        return
      }
      r.organization.lfxMembership = lfxMemberships.find(
        (lm) => lm.organizationId === r.organizationId,
      )
    })

    return {
      rows,
      count,
      limit,
      offset,
    }
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      advancedFilter = null as any,
      limit = 0,
      offset = 0,
      orderBy = '',
      attributesSettings = [] as AttributeData[],
    },
    options: IRepositoryOptions,
  ) {
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
          type: {
            textContains: filter.type,
          },
        })
      }

      if (filter.timestampRange) {
        const [start, end] = filter.timestampRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            timestamp: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            timestamp: {
              lte: end,
            },
          })
        }
      }

      if (filter.platform) {
        advancedFilter.and.push({
          platform: {
            textContains: filter.platform,
          },
        })
      }

      if (filter.member) {
        advancedFilter.and.push({
          memberId: filter.member,
        })
      }

      if (filter.objectMember) {
        advancedFilter.and.push({
          objectMemberId: filter.objectMember,
        })
      }

      if (
        filter.isContribution === true ||
        filter.isContribution === 'true' ||
        filter.isContribution === false ||
        filter.isContribution === 'false'
      ) {
        advancedFilter.and.push({
          isContribution: filter.isContribution === true || filter.isContribution === 'true',
        })
      }

      if (filter.scoreRange) {
        const [start, end] = filter.scoreRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            score: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            score: {
              lte: end,
            },
          })
        }
      }

      if (filter.channel) {
        advancedFilter.and.push({
          channel: {
            textContains: filter.channel,
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

      if (filter.title) {
        advancedFilter.and.push({
          title: {
            textContains: filter.title,
          },
        })
      }

      if (filter.url) {
        advancedFilter.and.push({
          textContains: filter.channel,
        })
      }

      if (filter.sentimentRange) {
        const [start, end] = filter.sentimentRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            sentiment: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            sentiment: {
              lte: end,
            },
          })
        }
      }

      if (filter.sentimentLabel) {
        advancedFilter.and.push({
          'sentiment.label': filter.sentimentLabel,
        })
      }

      for (const mood of ['positive', 'negative', 'neutral', 'mixed']) {
        if (filter[`${mood}SentimentRange`]) {
          const [start, end] = filter[`${mood}SentimentRange`]

          if (start !== undefined && start !== null && start !== '') {
            advancedFilter.and.push({
              [`sentiment.${mood}`]: {
                gte: start,
              },
            })
          }

          if (end !== undefined && end !== null && end !== '') {
            advancedFilter.and.push({
              [`sentiment.${mood}`]: {
                lte: end,
              },
            })
          }
        }
      }

      if (filter.parent) {
        advancedFilter.and.push({
          parentId: filter.parent,
        })
      }

      if (filter.sourceParentId) {
        advancedFilter.and.push({
          sourceParentId: filter.sourceParentId,
        })
      }

      if (filter.sourceId) {
        advancedFilter.and.push({
          sourceId: filter.sourceId,
        })
      }

      if (filter.conversationId) {
        advancedFilter.and.push({
          conversationId: filter.conversationId,
        })
      }

      if (filter.organizations) {
        advancedFilter.and.push({
          organizationId: filter.organizations,
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
              gte: end,
            },
          })
        }
      }
    }

    const memberSequelizeInclude = {
      model: options.database.member,
      as: 'member',
      where: {},
    }

    if (advancedFilter.member) {
      const { dynamicAttributesDefaultNestedFields, dynamicAttributesPlatformNestedFields } =
        await MemberRepository.getDynamicAttributesLiterals(attributesSettings, options)

      const memberQueryParser = new QueryParser(
        {
          nestedFields: {
            ...dynamicAttributesDefaultNestedFields,
            ...dynamicAttributesPlatformNestedFields,
            reach: 'reach.total',
          },
          manyToMany: {
            segments: {
              table: 'members',
              model: 'member',
              relationTable: {
                name: 'memberSegments',
                from: 'memberId',
                to: 'segmentId',
              },
            },
            organizations: {
              table: 'members',
              model: 'member',
              relationTable: {
                name: 'memberOrganizations',
                from: 'memberId',
                to: 'organizationId',
              },
            },
          },
          customOperators: {
            username: {
              model: 'member',
              column: 'username',
            },
            platform: {
              model: 'member',
              column: 'username',
            },
          },
        },
        options,
      )

      const parsedMemberQuery: QueryOutput = memberQueryParser.parse({
        filter: advancedFilter.member,
        orderBy: orderBy || ['joinedAt_DESC'],
        limit,
        offset,
      })

      memberSequelizeInclude.where = parsedMemberQuery.where ?? {}
      delete advancedFilter.member
    }

    if (advancedFilter.organizations) {
      advancedFilter.organizationId = advancedFilter.organizations
      delete advancedFilter.organizations
    }

    const include = [
      memberSequelizeInclude,
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

    const parser = new QueryParser(
      {
        nestedFields: {
          sentiment: 'sentiment.sentiment',
        },
        manyToMany: {
          organizations: {
            table: 'activities',
            model: 'activity',
            overrideJoinField: 'memberId',
            relationTable: {
              name: 'memberOrganizations',
              from: 'memberId',
              to: 'organizationId',
            },
          },
        },
      },
      options,
    )

    const parsed: QueryOutput = parser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['timestamp_DESC'],
      limit,
      offset,
    })

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.activity.findAndCountAll({
      include,
      attributes: [
        ...SequelizeFilterUtils.getLiteralProjectionsOfModel('activity', options.database),
      ],
      ...(parsed.where ? { where: parsed.where } : {}),
      ...(parsed.having ? { having: parsed.having } : {}),
      order: parsed.order,
      limit: parsed.limit,
      offset: parsed.offset,
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

  static async createResults(result: IIntegrationResult, options: IRepositoryOptions) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const seq = SequelizeRepository.getSequelize(options)

    result.segmentId = segment.id

    const results = await seq.query(
      `
      insert into integration.results(state, data, "tenantId")
      values(:state, :data, :tenantId)
      returning id;
      `,
      {
        replacements: {
          tenantId: tenant.id,
          state: IntegrationResultState.PENDING,
          data: JSON.stringify(result),
        },
        type: QueryTypes.INSERT,
      },
    )

    return results[0][0].id
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

    return output
  }
}

export default ActivityRepository
