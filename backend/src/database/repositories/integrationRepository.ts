import lodash from 'lodash'
import Sequelize, { QueryTypes } from 'sequelize'
import { IntegrationRunState } from '@crowd/types'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'

const { Op } = Sequelize
const log: boolean = false

class IntegrationRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const record = await options.database.integration.create(
      {
        ...lodash.pick(data, [
          'platform',
          'status',
          'limitCount',
          'limitLastResetAt',
          'token',
          'refreshToken',
          'settings',
          'integrationIdentifier',
          'importHash',
          'emailSentAt',
        ]),
        segmentId: segment.id,
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

    let record = await options.database.integration.findOne({
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
        ...lodash.pick(data, [
          'platform',
          'status',
          'limitCount',
          'limitLastResetAt',
          'token',
          'refreshToken',
          'settings',
          'integrationIdentifier',
          'importHash',
          'emailSentAt',
        ]),

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

    const record = await options.database.integration.findOne({
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

    // also mark integration runs as deleted
    const seq = SequelizeRepository.getSequelize(options)
    await seq.query(
      `update "integrationRuns" set state = :newState
     where "integrationId" = :integrationId and state in (:delayed, :pending, :processing)
    `,
      {
        replacements: {
          newState: IntegrationRunState.INTEGRATION_DELETED,
          delayed: IntegrationRunState.DELAYED,
          pending: IntegrationRunState.PENDING,
          processing: IntegrationRunState.PROCESSING,
          integrationId: id,
        },
        transaction,
      },
    )

    await seq.query(
      `update integration.runs set state = :newState
     where "integrationId" = :integrationId and state in (:delayed, :pending, :processing)`,
      {
        replacements: {
          newState: IntegrationRunState.INTEGRATION_DELETED,
          delayed: IntegrationRunState.DELAYED,
          pending: IntegrationRunState.PENDING,
          processing: IntegrationRunState.PROCESSING,
          integrationId: id,
        },
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findAllByPlatform(platform, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const records = await options.database.integration.findAll({
      where: {
        platform,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    return records.map((record) => record.get({ plain: true }))
  }

  static async findByPlatform(platform, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.integration.findOne({
      where: {
        platform,
        tenantId: currentTenant.id,
        segmentId: segment.id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  /**
   * Find all active integrations for a platform
   * @param platform The platform we want to find all active integrations for
   * @returns All active integrations for the platform
   */
  static async findAllActive(platform: string, page: number, perPage: number): Promise<any[]> {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const records = await options.database.integration.findAll({
      where: {
        status: 'done',
        platform,
      },
      limit: perPage,
      offset: (page - 1) * perPage,
    })

    if (!records) {
      throw new Error404()
    }

    return Promise.all(records.map((record) => this._populateRelations(record)))
  }

  static async findByStatus(
    status: string,
    page: number,
    perPage: number,
    options: IRepositoryOptions,
  ): Promise<any[]> {
    const query = `
      select * from integrations where status = :status
      limit ${perPage} offset ${(page - 1) * perPage}
    `

    const seq = SequelizeRepository.getSequelize(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const integrations = await seq.query(query, {
      replacements: {
        status,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    return integrations as any[]
  }

  /**
   * Find an integration using the integration identifier and a platform.
   * Tenant not needed.
   * @param identifier The integration identifier
   * @returns The integration object
   */
  // TODO: Test
  static async findByIdentifier(identifier: string, platform: string): Promise<Array<Object>> {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const record = await options.database.integration.findOne({
      where: {
        integrationIdentifier: identifier,
        platform,
        deletedAt: null,
      },
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.integration.findOne({
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

    const records = await options.database.integration.findAll({
      attributes: ['id'],
      where,
    })

    return records.map((record) => record.id)
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    return options.database.integration.count({
      where: {
        ...filter,
        tenantId: tenant.id,
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

      if (filter.platform) {
        advancedFilter.and.push({
          platform: filter.platform,
        })
      }

      if (filter.status) {
        advancedFilter.and.push({
          status: filter.status,
        })
      }

      if (filter.limitCountRange) {
        const [start, end] = filter.limitCountRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            limitCount: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            limitCount: {
              lte: end,
            },
          })
        }
      }

      if (filter.limitLastResetAtRange) {
        const [start, end] = filter.limitLastResetAtRange

        if (start !== undefined && start !== null && start !== '') {
          advancedFilter.and.push({
            limitLastResetAt: {
              gte: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          advancedFilter.and.push({
            limitLastResetAt: {
              lte: end,
            },
          })
        }
      }

      if (filter.integrationIdentifier) {
        advancedFilter.and.push({
          integrationIdentifier: filter.integrationIdentifier,
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
        nestedFields: {
          sentiment: 'sentiment.sentiment',
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
    } = await options.database.integration.findAndCountAll({
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
    ]

    if (query) {
      whereAnd.push({
        [Op.or]: [
          { id: SequelizeFilterUtils.uuid(query) },
          {
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('integration', 'platform', query),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.integration.findAll({
      attributes: ['id', 'platform'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['platform', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.platform,
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
          entityName: 'integration',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
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

export default IntegrationRepository
