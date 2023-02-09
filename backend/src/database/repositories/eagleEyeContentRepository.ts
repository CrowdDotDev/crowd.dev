import lodash from 'lodash'
import { Op } from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'
import { EagleEyeContent } from '../../types/eagleEyeTypes'
import QueryParser from './filters/queryParser'
import { QueryOutput } from './filters/queryTypes'
import EagleEyeActionRepository from './eagleEyeActionRepository'

export default class EagleEyeContentRepository {
  static async create(
    data: EagleEyeContent,
    options: IRepositoryOptions,
  ): Promise<EagleEyeContent> {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeContent.create({
      ...lodash.pick(data, ['platform', 'post', 'url', 'postedAt']),
      tenantId: currentTenant.id,
    })

    if (data.actions) {
      for (const action of data.actions) {
        await EagleEyeActionRepository.createActionForContent(action, record.id, options)
      }
    }

    return this.findById(record.id, options)
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

    record = await record.update(
      {
        ...lodash.pick(data, ['platform', 'post', 'postedAt', 'url']),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    return this.findById(record.id, options)
  }

  static async findById(id: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = [
      {
        model: options.database.eagleEyeAction,
        as: 'actions',
      },
    ]

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

  static async destroy(id: string, options: IRepositoryOptions): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeContent.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (record) {
      await record.destroy({
        transaction,
        force: true,
      })
    }
  }

  static async findAndCountAll(
    { advancedFilter = null as any, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const actionsSequelizeInclude = {
      model: options.database.eagleEyeAction,
      as: 'actions',
      where: {},
    }

    if (advancedFilter && advancedFilter.action) {
      const actionQueryParser = new QueryParser({}, options)

      const parsedActionQuery: QueryOutput = actionQueryParser.parse({
        filter: advancedFilter.action,
        orderBy: 'timestamp_DESC',
      })

      actionsSequelizeInclude.where = parsedActionQuery.where ?? {}
      delete advancedFilter.action
    }

    const include = [actionsSequelizeInclude]

    const contentParser = new QueryParser({}, options)

    const parsed: QueryOutput = contentParser.parse({
      filter: advancedFilter,
      orderBy: orderBy || ['postedAt_DESC'],
      limit,
      offset,
    })

    let {
      rows,
      count, // eslint-disable-line prefer-const
    } = await options.database.eagleEyeContent.findAndCountAll({
      include,
      ...(parsed.where ? { where: parsed.where } : {}),
      order: parsed.order,
      limit: parsed.limit,
      offset: parsed.offset,
      transaction: SequelizeRepository.getTransaction(options),
      subQuery: false,
    })

    // If we have an actions filter, we should query again to eager
    // load the all actions on a content because previous query will
    // omit actions that don't match the given action filter
    if (Object.keys(actionsSequelizeInclude.where).length !== 0) {
      rows = (
        await options.database.eagleEyeContent.findAndCountAll({
          include: [{ ...actionsSequelizeInclude, where: {} }],
          where: { id: { [Op.in]: rows.map((i) => i.id) } },
          order: parsed.order,
          limit: parsed.limit,
          offset: parsed.offset,
          transaction: SequelizeRepository.getTransaction(options),
          subQuery: false,
        })
      ).rows
    }

    rows = await this._populateRelationsForRows(rows)

    return { rows, count, limit: parsed.limit, offset: parsed.offset }
  }

  static async findByUrl(url: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeContent.findOne({
      where: {
        url,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      return null
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
