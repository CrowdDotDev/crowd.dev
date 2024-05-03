import lodash from 'lodash'
import Sequelize from 'sequelize'
import { PageData, PlatformType } from '@crowd/types'
import { Error404, single } from '@crowd/common'
import { ActivityDisplayService } from '@crowd/integrations'
import {
  IQueryActivityResult,
  deleteConversations,
  getConversationById,
  insertConversation,
  queryActivities,
  updateConversation,
} from '@crowd/data-access-layer'
import { IDbConversation } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/conversation.data'
import { QueryOutput } from './filters/queryTypes'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import SegmentRepository from './segmentRepository'
import MemberRepository from './memberRepository'

class ConversationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const id = await insertConversation(options.qdb, {
      title: data.title,
      slug: data.slug,
      published: data.published,
      tenantId: tenant.id,
      segmentId: segment.id,
      createdById: currentUser.id,
      updatedById: currentUser.id,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    })

    // still leave it in postgresql for now
    await options.database.conversation.create(
      {
        id,
        ...lodash.pick(data, ['title', 'slug', 'published']),
        tenantId: tenant.id,
        segmentId: segment.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    const record = await this.findById(id, options)

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return record
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.conversation.findOne({
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

    await record.update(
      {
        ...lodash.pick(data, ['title', 'slug', 'published']),

        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await updateConversation(options.qdb, id, {
      tenantId: currentTenant.id,
      segmentId: segment.id,
      title: data.title,
      slug: data.slug,
      published: data.published,
      updatedById: currentUser.id,
    })

    record = await this.findById(id, options)

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return record
  }

  static async destroy(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.conversation.findOne({
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
    })

    await deleteConversations(options.qdb, [id])

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // quest db for selects
    const conversation = await getConversationById(
      options.qdb,
      id,
      currentTenant.id,
      SequelizeRepository.getSegmentIds(options),
    )

    if (!conversation) {
      throw new Error404()
    }

    return this._populateRelations(conversation, options)
  }

  static async destroyBulk(ids: string[], options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    await options.database.conversation.destroy({
      where: {
        id: ids,
        tenantId: currentTenant.id,
        segmentId: SequelizeRepository.getSegmentIds(options),
      },
      force,
      transaction,
    })

    await deleteConversations(options.qdb, ids)
  }

  static async findAndCountAll(
    {
      filter = {} as any,
      advancedFilter = null as any,
      limit = 0,
      offset = 0,
      orderBy = '',
      lazyLoad = [],
    },
    options: IRepositoryOptions,
  ) {
    let customOrderBy: Array<any> = []
    const include = [
      // TODO questdb load activities for conversations
      // {
      //   model: options.database.activity,
      //   as: 'activities',
      //   attributes: [],
      //   where: {} as Record<string, any>,
      // },
    ]

    orderBy = 'lastActive_DESC'

    // Quick win, need to be improved. We are seeing long requests because
    // filters are applied in HAVING using Sequelize, but setting these in
    // WHERE clause is better for performances.
    // if (advancedFilter) {
    //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //   Object.entries(advancedFilter).forEach(([key, value], index) => {
    //     if (Array.isArray(value) && value.length > 0) {
    //       include = applyHavingInWhereClause(include, value)
    //     }
    //   })
    // }

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

      // TODO questdb fix - how to filter by activity count here?
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
    // TODO questdb fix
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('activityCount', orderBy),
    )
    // TODO questdb fix
    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('lastActive', orderBy),
    )

    customOrderBy = customOrderBy.concat(
      SequelizeFilterUtils.customOrderByIfExists('channel', orderBy),
    )

    // TODO questdb fix
    const activityCount = options.database.Sequelize.fn(
      'COUNT',
      options.database.Sequelize.col('activities.id'),
    )

    // TODO questdb fix
    const lastActive = options.database.Sequelize.fn(
      'MAX',
      options.database.Sequelize.col('activities.timestamp'),
    )

    // TODO questdb
    const platform = Sequelize.col('activities.platform')

    const parser = new QueryParser(
      {
        aggregators: {
          ...SequelizeFilterUtils.getNativeTableFieldAggregations(
            [
              'id',
              'title',
              'slug',
              'published',
              'createdAt',
              'updatedAt',
              'tenantId',
              'segmentId',
              'createdById',
              'updatedById',
            ],
            'conversation',
          ),
          activityCount,
          channel: Sequelize.literal(`"activities"."channel"`),
          lastActive,
          platform,
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

    let order = parsed.order

    if (customOrderBy.length > 0) {
      order = [customOrderBy]
    } else if (orderBy) {
      order = [orderBy.split('_')]
    }

    // eslint-disable-next-line prefer-const
    let rows = await options.database.conversation.findAll({
      attributes: [
        ...SequelizeFilterUtils.getLiteralProjections(
          [
            'id',
            'title',
            'slug',
            'published',
            'createdAt',
            'tenantId',
            'segmentId',
            'updatedAt',
            'createdById',
            'updatedById',
          ],
          'conversation',
        ),
        [platform, 'platform'],
        [activityCount, 'activityCount'],
        [lastActive, 'lastActive'],
        [Sequelize.literal(`MAX("activities"."channel")`), 'channel'],
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
    rows = await this._populateRelationsForRows(rows, options, lazyLoad)
    const [countRow] = await options.database.sequelize.query(
      `
        SELECT n_live_tup AS count
        FROM pg_stat_all_tables
        WHERE schemaname = 'public'
          AND relname = 'conversations'
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        transaction: SequelizeRepository.getTransaction(options),
      },
    )
    const { count } = countRow
    return { rows, count: parseInt(count, 10) }
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

  static async _populateRelationsForRows(
    rows: IDbConversation[],
    options: IRepositoryOptions,
    lazyLoad: string[] = [],
  ) {
    if (!rows) {
      return rows
    }

    return Promise.all(
      rows.map(async (record) => this._populateRelations(record, options, lazyLoad)),
    )
  }

  static extractGitHubRepoPath(url) {
    if (!url) return null
    const match = url.match(/^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/)
    if (!match || !(match.groups?.owner && match.groups?.name)) return null
    return `${match.groups.owner}/${match.groups.name}`
  }

  static async _populateRelations(
    conversation: IDbConversation,
    options: IRepositoryOptions,
    lazyLoad: string[] = [],
  ) {
    if (!conversation) {
      return conversation
    }

    const output: any = { ...conversation }

    if (lazyLoad.includes('activities')) {
      const results = (await queryActivities(options.qdb, {
        filter: {
          and: [{ conversationId: { eq: conversation.id } }],
        },
        noLimit: true,
        tenantId: conversation.tenantId,
        segmentIds: [conversation.segmentId],
      })) as PageData<IQueryActivityResult>

      // find the first one
      const firstActivity = single(results.rows, (a) => a.parentId === null)
      const remainingActivities = results.rows
        .filter((a) => a.parentId !== null)
        .sort(
          (a, b) =>
            // from oldest to newest
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )

      output.activities = [firstActivity, ...remainingActivities]

      const memberIds: string[] = []
      for (const activity of output.activities) {
        if (!memberIds.includes(activity.memberId)) {
          memberIds.push(activity.memberId)
        }

        if (activity.objectMemberId && !memberIds.includes(activity.objectMemberId)) {
          memberIds.push(activity.objectMemberId)
        }

        activity.display = ActivityDisplayService.getDisplayOptions(
          activity,
          SegmentRepository.getActivityTypes(options),
        )
      }

      if (memberIds.length > 0) {
        const memberResults = await MemberRepository.findAndCountAllOpensearch(
          {
            filter: {
              and: [
                {
                  id: { in: memberIds },
                },
              ],
            },
            limit: memberIds.length,
          },
          options,
        )

        for (const activity of output.activities) {
          activity.member = memberResults.rows.find((m) => m.id === activity.memberId)
          if (activity.objectMemberId) {
            activity.objectMember = memberResults.rows.find((m) => m.id === activity.objectMemberId)
          }
        }
      }

      output.memberCount = memberIds.length
      output.conversationStarter = output.activities[0] ?? null
      output.activityCount = output.activities.length
      output.platform = null
      output.channel = null
      output.lastActive = null

      if (output.activityCount > 0) {
        output.platform = output.activities[0].platform ?? null
        output.lastActive = output.activities[output.activities.length - 1].timestamp
        output.channel = output.activities[0].channel ? output.activities[0].channel : null

        if (output.platform && output.platform === PlatformType.GITHUB) {
          output.channel = this.extractGitHubRepoPath(output.channel)
        }
      }
    }

    return output
  }
}

export default ConversationRepository
