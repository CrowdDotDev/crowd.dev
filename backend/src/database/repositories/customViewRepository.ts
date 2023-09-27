import lodash from 'lodash'
import Error404 from '../../errors/Error404'
import SequelizeRepository from './sequelizeRepository'
import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'

class CustomViewRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.tag.create(
      {
        ...lodash.pick(data, ['name', 'visibility', 'config', 'placement']),
        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await options.database.customViewOrder.create(
      {
        memberId: currentUser.id,
        customViewId: record.id,
        order: data.order || 0,
      },
      {
        transaction,
      },
    )

    // adds event to audit log
    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.tag.findOne({
      where: {
        id,
        tenantId: tenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    // we don't allow placement to be updated
    record = await record.update(
      {
        ...lodash.pick(data, ['name', 'visibility', 'config']),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    // update order if it was sent
    if (data.order) {
      await options.database.customViewOrder.update(
        {
          order: data.order,
        },
        {
          where: {
            customViewId: record.id,
          },
          transaction,
        },
      )
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.customView.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    // update who deleted the custom view
    await record.update(
      {
        deletedById: currentUser.id,
      },
      { transaction },
    )

    // soft delete the custom view
    await record.destroy({
      transaction,
      force,
    })

    // delete the order
    await options.database.customViewOrder.destroy({
      where: {
        customViewId: record.id,
      },
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.customView.findOne({
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

    return record
  }

  static async findAll(filter, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const where = {
      ...lodash.pick(filter, ['visibility', 'placement']),
      tenantId: tenant.id,
    }

    const customViewrecords = await options.database.customView.findAll({
      where,
      transaction,
    })

    const customViewIds = customViewrecords.map((customView) => customView.id)

    const customViewOrders = await options.database.customViewOrder.findAll({
      where: {
        memberId: currentUser.id,
        customViewId: customViewIds,
      },
      transaction,
    })

    // sort custom views by order
    const result = customViewOrders.sort((a, b) => a.order - b.order)

    return result
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = record.get({ plain: true })
    }

    await AuditLogRepository.log(
      {
        entityName: 'customView',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }
}

export default CustomViewRepository
