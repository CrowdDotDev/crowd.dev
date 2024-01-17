import lodash from 'lodash'
import Sequelize from 'sequelize'
import { PlatformType } from '@crowd/types'
import { Error404 } from '@crowd/common'
import { ActivityDisplayService } from '@crowd/integrations'
import { QueryOutput } from './filters/queryTypes'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'
import snakeCaseNames from '../../utils/snakeCaseNames'
import QueryParser from './filters/queryParser'
import SegmentRepository from './segmentRepository'

const Op = Sequelize.Op

class ConversationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const record = await options.database.conversation.create(
      {
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

    await record.setActivities(data.activities || [], {
      transaction,
    })

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
        segmentId: SequelizeRepository.getSegmentIds(options),
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

    if (data.activities) {
      await record.setActivities(data.activities, {
        transaction,
      })
    }

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

    const records = await options.database.conversation.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async destroyBulk(ids, options: IRepositoryOptions, force = false) {
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
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.conversation.count({
      where: {
        ...filter,
        tenantId: tenant.id,
        segmentId: SequelizeRepository.getSegmentIds(options),
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
      lazyLoad = [],
    },
    options: IRepositoryOptions,
  ) {
    let customOrderBy: Array<any> = []
    let include = [
      {
        model: options.database.activity,
        as: 'activities',
        attributes: [],
        where: {} as Record<string, any>,
      },
    ]

    orderBy = 'lastActive_DESC'

    // Quick win, need to be improved. We are seeing long requests because
    // filters are applied in HAVING using Sequelize, but setting these in
    // WHERE clause is better for performances.
    if (advancedFilter) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(advancedFilter).forEach(([key, value], index) => {
        if (Array.isArray(value) && value.length > 0) {
          include = applyHavingInWhereClause(include, value)
        }
      })
    }

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
      SequelizeFilterUtils.customOrderByIfExists('channel', orderBy),
    )

    const activityCount = options.database.Sequelize.fn(
      'COUNT',
      options.database.Sequelize.col('activities.id'),
    )

    const lastActive = options.database.Sequelize.fn(
      'MAX',
      options.database.Sequelize.col('activities.timestamp'),
    )

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
    let { rows, count } = await options.database.conversation.findAndCountAll({
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

  /**
   * Counts distinct members in a conversation
   * @param activities Activity list in a conversation
   */
  static getTotalMemberCount(activities) {
    return (
      activities.reduce((acc, i) => {
        if (!acc.ids) {
          acc.ids = []
          acc.count = 0
        }

        if (!acc.ids[i.memberId]) {
          acc.ids[i.memberId] = true
          acc.count += 1
        }
        return acc
      }, {}).count ?? 0
    )
  }

  static async _populateRelationsForRows(rows, options, lazyLoad = []) {
    if (!rows) {
      return rows
    }

    return Promise.all(
      rows.map(async (record) => {
        const rec = record.get({ plain: true })
        for (const relationship of lazyLoad) {
          if (relationship === 'activities') {
            const allActivities = await record.getActivities({
              order: [
                ['timestamp', 'ASC'],
                ['createdAt', 'ASC'],
              ],
              include: ['parent', 'organization'],
            })

            rec.memberCount = ConversationRepository.getTotalMemberCount(allActivities)

            if (allActivities.length > 0) {
              let neededActivities = []
              const parentActivity =
                allActivities.find((a) => a.parent === null) || allActivities[0]

              if (parentActivity) {
                neededActivities = [parentActivity]
              }

              if (allActivities.length > 2) {
                neededActivities = [
                  ...neededActivities,
                  allActivities[allActivities.length - 2],
                  allActivities[allActivities.length - 1],
                ]
              } else {
                neededActivities = [...neededActivities, allActivities[allActivities.length - 1]]
              }

              const promises = neededActivities.map(async (act) => {
                const member = (await act.getMember()).get({ plain: true })

                let objectMember = null
                if (act.objectMemberId) {
                  objectMember = (await act.getObjectMember()).get({ plain: true })
                }

                act = act.get({ plain: true })
                act.member = member
                act.objectMember = objectMember
                act.display = ActivityDisplayService.getDisplayOptions(
                  act,
                  SegmentRepository.getActivityTypes(options),
                )

                return act
              })
              const returnedNeededActivities = await Promise.all(promises)
              rec.conversationStarter = returnedNeededActivities[0]
              rec.lastReplies = returnedNeededActivities.slice(1)
            } else {
              rec.conversationStarter = null
              rec.lastReplies = []
            }

            if (rec.conversationStarter) {
              rec.conversationStarter.display = ActivityDisplayService.getDisplayOptions(
                rec.conversationStarter,
                SegmentRepository.getActivityTypes(options),
              )
            }
          } else {
            rec[relationship] = (await record[`get${snakeCaseNames(relationship)}`]()).map((a) =>
              a.get({ plain: true }),
            )
          }
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

    // Fetch the first activity with parent = null
    const firstActivity = await record.getActivities({
      where: {
        parentId: null,
      },
      include: ['member', 'parent', 'objectMember', 'organization'],
      transaction,
      order: [
        ['timestamp', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    })

    // Fetch remaining activities with parent != null
    const remainingActivities = await record.getActivities({
      where: {
        parentId: {
          [Sequelize.Op.not]: null,
        },
      },
      include: ['member', 'parent', 'objectMember', 'organization'],
      order: [
        ['timestamp', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      transaction,
    })

    output.activities = [...firstActivity, ...remainingActivities]

    let memberPromises = output.activities.map(async (act) => {
      const member = (await act.getMember()).get({ plain: true })
      act = act.get({ plain: true })
      act.member = member
      act.display = ActivityDisplayService.getDisplayOptions(
        act,
        SegmentRepository.getActivityTypes(options),
      )
      return act
    })

    const chunkedPromises = []

    const CHUNK_PROMISE_SIZE = 50

    if (memberPromises.length > CHUNK_PROMISE_SIZE) {
      while (memberPromises.length > CHUNK_PROMISE_SIZE) {
        chunkedPromises.push(memberPromises.slice(0, CHUNK_PROMISE_SIZE))
        memberPromises = memberPromises.slice(CHUNK_PROMISE_SIZE)
      }
      if (memberPromises.length > 0) {
        chunkedPromises.push(memberPromises)
      }
    } else {
      chunkedPromises.push(memberPromises)
    }

    output.activities = []
    for (const memberPromiseChunk of chunkedPromises) {
      output.activities.push(...(await Promise.all(memberPromiseChunk)))
    }

    output.memberCount = ConversationRepository.getTotalMemberCount(output.activities)
    output.conversationStarter = output.activities[0] ?? null
    output.activityCount = output.activities.length
    output.platform = null
    output.channel = null
    output.lastActive = null

    if (output.activityCount > 0) {
      output.platform = output.activities[0].platform ?? null
      output.lastActive = output.activities[output.activities.length - 1].timestamp
      output.channel = output.activities[0].channel ? output.activities[0].channel : null
      output.conversationStarter.display = ActivityDisplayService.getDisplayOptions(
        output.conversationStarter,
        SegmentRepository.getActivityTypes(options),
      )
    }

    return output
  }
}

function applyHavingInWhereClause(include, value) {
  value.forEach((constraint) => {
    if (constraint.and) {
      include = applyHavingInWhereClause(include, constraint.and)
    } else if (constraint.or) {
      include = applyHavingInWhereClause(include, constraint.or)
    }

    if (constraint.lastActive) {
      if (!include[0].where.timestamp) {
        include[0].where.timestamp = {}
      }

      if (constraint.lastActive.gte) {
        include[0].where.timestamp[Op.gte] = constraint.lastActive.gte
      }
      if (constraint.lastActive.lte) {
        include[0].where.timestamp[Op.lte] = constraint.lastActive.lte
      }
      if (constraint.lastActive.between) {
        include[0].where.timestamp[Op.between] = constraint.lastActive.between
      }
      if (constraint.lastActive.not) {
        if (constraint.lastActive.not.between) {
          include[0].where.timestamp[Op.notBetween] = constraint.lastActive.not.between
        }
      }
    } else if (constraint.platform) {
      if (!include[0].where.platform) {
        include[0].where.platform = {
          [Op.in]: [],
        }
      }

      include[0].where.platform[Op.in].push(constraint.platform)
    } else if (constraint.createdAt) {
      include[0].where.createdAt = {
        [Op.gte]: constraint.createdAt.gte,
      }
    }
  })

  return include
}

export default ConversationRepository
