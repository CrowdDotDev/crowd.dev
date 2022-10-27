import moment from 'moment'
import lodash from 'lodash'
import SequelizeRepository from './sequelizeRepository'
import Error404 from '../../errors/Error404'
import Error400 from '../../errors/Error400'
import AuditLogRepository from './auditLogRepository'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'

export default class EagleEyeContentRepository {
  /**
   * Create an eagle eye shown content record.
   * @param data Data to a new EagleEyeContent record.
   * @param options Repository options.
   * @returns Created EagleEyeContent record.
   */
  static async upsert(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    if (data.status && ![null, 'rejected', 'engaged'].includes(data.status)) {
      throw new Error400('en', 'errors.invalidEagleEyeStatus.message')
    }

    const existing = await options.database.eagleEyeContent.findOne({
      where: {
        tenantId: tenant.id,
        sourceId: data.sourceId,
      },
    })

    // If the content is already shown, we don't need to add it again
    if (existing) {
      // If the content comes from a different kewword, we also add it
      if (!lodash.isEqual(data.keywords.sort(), existing.keywords.sort())) {
        const keywords = lodash.uniq([...existing.keywords, ...data.keywords])
        const similarityScore = data.similarityScore
        return existing.update(
          {
            keywords,
            similarityScore,
          },
          {
            transaction,
          },
        )
      }
      return existing
    }

    if (typeof data.keywords === 'string') {
      data.keywords = [data.keywords]
    }

    if (typeof data.timestamp === 'number') {
      data.timestamp = moment.unix(data.timestamp).toDate()
    }

    const record = await options.database.eagleEyeContent.create(
      {
        ...lodash.pick(data, [
          'sourceId',
          'vectorId',
          'status',
          'postAttributes',
          'title',
          'username',
          'url',
          'text',
          'timestamp',
          'userAttributes',
          'platform',
          'keywords',
          'similarityScore',
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

    await AuditLogRepository.log(
      {
        entityName: 'eagleEyeContent',
        entityId: record.id,
        action: AuditLogRepository.CREATE,
        values: data,
      },
      options,
    )

    return this.findById(record.id, options)
  }

  /**
   * EagleEyeContent find all records matching given criteria.
   * @returns Records found.
   */
  static async findAndCountAll(
    { filter = {} as any, advancedFilter = null as any, limit = 0, offset = 0, orderBy = '' },
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

      if (filter.sourceId) {
        advancedFilter.and.push({
          sourceId: filter.sourceId,
        })
      }

      if (filter.vectorId) {
        advancedFilter.and.push({
          vectorId: filter.vectorId,
        })
      }

      if (filter.status) {
        if (filter.status === 'NULL') {
          advancedFilter.and.push({
            status: 'NULL',
          })
        } else if (filter.status === 'NOT_NULL') {
          advancedFilter.and.push({
            status: {
              not: null,
            },
          })
        } else {
          advancedFilter.and.push({
            status: {
              textContains: filter.status,
            },
          })
        }
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

      if (filter.platforms) {
        advancedFilter.and.push({
          platform: {
            or: filter.platforms.split(','),
          },
        })
      }

      if (filter.nDays) {
        advancedFilter.and.push({
          timestamp: {
            gte: moment().subtract(filter.nDays, 'days').toDate(),
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

      if (filter.text) {
        advancedFilter.and.push({
          text: {
            textContains: filter.text,
          },
        })
      }

      if (filter.url) {
        advancedFilter.and.push({
          url: {
            textContains: filter.url,
          },
        })
      }

      if (filter.username) {
        advancedFilter.and.push({
          username: {
            textContains: filter.username,
          },
        })
      }

      if (filter.keywords) {
        // Overlap will take a post where any keyword matches any of the filter keywords
        advancedFilter.and.push({
          keywords: {
            overlap: filter.keywords.split(','),
          },
        })
      }

      if (filter.similarityScoreRange) {
        const [start, end] = filter.similarityScoreRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            similarityScore: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            similarityScore: {
              lte: end,
            },
          })
        }
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
    } = await options.database.eagleEyeContent.findAndCountAll({
      ...(parsed.where ? { where: parsed.where } : {}),
      ...(parsed.having ? { having: parsed.having } : {}),
      order: parsed.order,
      limit: parsed.limit,
      offset: parsed.offset,
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count, limit: parsed.limit, offset: parsed.offset }
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.eagleEyeContent.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    if (data.status && ![null, 'rejected', 'engaged'].includes(data.status)) {
      throw new Error400('en', 'errors.invalidEagleEyeStatus.message')
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'sourceId',
          'vectorId',
          'status',
          'title',
          'username',
          'url',
          'text',
          'postAttributes',
          'timestamp',
          'platform',
          'userAttributes',
          'importHash',
          // Missing keywords on purpose
        ]),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await AuditLogRepository.log(
      {
        entityName: 'eagleEyeContent',
        entityId: record.id,
        action: AuditLogRepository.UPDATE,
        values: data,
      },
      options,
    )
    return this.findById(record.id, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeContent.findOne({
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

    return record.get({ plain: true })
  }
}
