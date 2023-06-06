import Sequelize, { QueryTypes } from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import { IRepositoryOptions } from './IRepositoryOptions'

const { Op } = Sequelize

export default class AuditLogRepository {
  static get CREATE() {
    return 'create'
  }

  static get UPDATE() {
    return 'update'
  }

  static get DELETE() {
    return 'delete'
  }

  /**
   * Saves an Audit Log to the database.
   *
   * @param  {Object} log - The log being saved.
   * @param  {string} log.entityName - The name of the entity. Ex.: customer
   * @param  {string} log.entityId - The id of the entity.
   * @param  {string} log.action - The action [create, update or delete].
   * @param  {Object} log.values - The JSON log value with data of the entity.
   *
   * @param  {Object} options
   * @param  {Object} options.transaction - The current database transaction.
   * @param  {Object} options.currentUser - The current logged user.
   * @param  {Object} options.currentTenant - The current currentTenant.
   */
  static async log({ entityName, entityId, action, values }, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const log = await options.database.auditLog.create(
      {
        entityName,
        tenantId: currentTenant.id,
        entityId,
        action,
        values,
        timestamp: new Date(),
        createdById: options && options.currentUser ? options.currentUser.id : null,
        createdByEmail: options && options.currentUser ? options.currentUser.email : null,
      },
      { transaction },
    )

    return log
  }

  static async cleanUpOldAuditLogs(
    maxMonthsToKeep: number,
    options: IRepositoryOptions,
  ): Promise<void> {
    const seq = SequelizeRepository.getSequelize(options)

    await seq.query(
      `
      delete from "auditLogs" where timestamp < now() - interval '${maxMonthsToKeep} months'
      `,
      {
        type: QueryTypes.DELETE,
      },
    )
  }

  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = []
    const include = []

    whereAnd.push({
      tenantId: tenant.id,
    })

    if (filter) {
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

      if (filter.action) {
        whereAnd.push({
          action: filter.action,
        })
      }

      if (filter.entityId) {
        whereAnd.push({
          entityId: filter.entityId,
        })
      }

      if (filter.createdByEmail) {
        whereAnd.push({
          [Op.and]: SequelizeFilterUtils.ilikeIncludes(
            'auditLog',
            'createdByEmail',
            filter.createdByEmail,
          ),
        })
      }

      if (filter.entityNames && filter.entityNames.length) {
        whereAnd.push({
          entityName: {
            [Op.in]: filter.entityNames,
          },
        })
      }
    }

    const where = { [Op.and]: whereAnd }

    return options.database.auditLog.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy ? [orderBy.split('_')] : [['timestamp', 'DESC']],
    })
  }
}
