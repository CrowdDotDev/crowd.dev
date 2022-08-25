import moment from 'moment'
import lodash from 'lodash'
import Sequelize from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import Error404 from '../../errors/Error404'
import Error400 from '../../errors/Error400'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'

const { Op } = Sequelize

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
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = []

    whereAnd.push({
      tenantId: tenant.id,
    })

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          id: SequelizeFilterUtils.uuid(filter.id),
        })
      }

      if (filter.sourceId) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'sourceId', filter.sourceId),
        )
      }

      if (filter.vectorId) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'sourceId', filter.sourceId),
        )
      }

      if (filter.status) {
        if (filter.status === 'NULL') {
          whereAnd.push({
            status: null,
          })
        } else if (filter.status === 'NOT_NULL') {
          whereAnd.push({
            status: {
              [Op.not]: null,
            },
          })
        } else {
          whereAnd.push(
            SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'status', filter.status),
          )
        }
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

      if (filter.platforms) {
        whereAnd.push({
          platform: {
            [Op.or]: filter.platforms.split(','),
          },
        })
      }

      if (filter.nDays) {
        whereAnd.push({
          timestamp: {
            [Op.gte]: moment().subtract(filter.nDays, 'days').toDate(),
          },
        })
      }

      if (filter.title) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'title', filter.title))
      }

      if (filter.text) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'text', filter.text))
      }

      if (filter.url) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'url', filter.url))
      }

      if (filter.username) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes('eagleEyeContent', 'username', filter.username),
        )
      }

      if (filter.keywords) {
        whereAnd.push({
          keywords: {
            [Op.contains]: filter.keywords.split(','),
          },
        })
      }

      if (filter.similarityScoreRange) {
        const [start, end] = filter.similarityScoreRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            similarityScore: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            similarityScore: {
              [Op.lte]: end,
            },
          })
        }
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
    } = await options.database.eagleEyeContent.findAndCountAll({
      where,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : undefined,
      order: orderBy ? [orderBy.split('_')] : [['similarityScore', 'DESC']],
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count }
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
