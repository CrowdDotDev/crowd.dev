import sanitizeHtml from 'sanitize-html'
import lodash from 'lodash'
import Sequelize from 'sequelize'
import { ActivityTypeSettings } from '@crowd/types'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error400 from '../../errors/Error400'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'
import { AttributeData } from '../attributes/attribute'
import MemberRepository from './memberRepository'
import ActivityDisplayService from '../../services/activityDisplayService'
import SegmentRepository from './segmentRepository'

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
        segmentId: SegmentRepository.getSegmentIds(options),
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
        include: [
          {
            model: options.database.segment,
            as: 'segments',
            through: {
              attributes: [],
            },
          },
        ],
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
        segmentId: SegmentRepository.getSegmentIds(options),
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record, options)
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
        segmentId: SegmentRepository.getSegmentIds(options),
        ...query,
      },
      transaction,
    })

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
        segmentId: SegmentRepository.getSegmentIds(options),
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
            tags: {
              table: 'members',
              model: 'member',
              relationTable: {
                name: 'memberTags',
                from: 'memberId',
                to: 'tagId',
              },
            },
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

    const include = [
      memberSequelizeInclude,
      {
        model: options.database.activity,
        as: 'parent',
      },
      {
        model: options.database.member,
        as: 'objectMember',
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
    const transaction = SequelizeRepository.getTransaction(options)

    const output = record.get({ plain: true })

    const activityTypes = options.currentTenant.settings[0].dataValues
      .activityTypes as ActivityTypeSettings

    output.display = ActivityDisplayService.getDisplayOptions(record, activityTypes)

    output.tasks = await record.getTasks({
      transaction,
      joinTableAttributes: [],
    })

    return output
  }
}

export default ActivityRepository
