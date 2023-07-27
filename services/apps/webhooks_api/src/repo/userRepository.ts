import SequelizeRepository from './sequelizeRepository'
import Error404 from '../errors/Error404'
import { isUserInTenant } from '../utils/userTenantUtils'
import { IRepositoryOptions } from './IRepositoryOptions'

export default class UserRepository {
  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.user.findByPk(id, {
      transaction,
    })

    record = await this._populateRelations(record, options)

    if (!record) {
      throw new Error404()
    }

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    if (!options || !options.bypassPermissionValidation) {
      if (!isUserInTenant(record, currentTenant)) {
        throw new Error404()
      }

      record = this._mapUserForTenant(record, currentTenant)
    }

    return record
  }

  static async _populateRelations(record, options: IRepositoryOptions) {
    if (!record) {
      return record
    }

    const output = record.get({ plain: true })

    output.tenants = await record.getTenants({
      include: [
        {
          model: options.database.tenant,
          as: 'tenant',
          required: true,
          include: ['settings', 'conversationSettings'],
        },
      ],
      transaction: SequelizeRepository.getTransaction(options),
    })

    return output
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    return options.database.user.count({
      where: filter,
      transaction,
    })
  }

  static _mapUserForTenant(user, tenant) {
    if (!user || !user.tenants) {
      return user
    }

    const tenantUser = user.tenants.find(
      (tenantUser) =>
        tenantUser && tenantUser.tenant && String(tenantUser.tenant.id) === String(tenant.id),
    )

    delete user.tenants

    const status = tenantUser ? tenantUser.status : null
    const roles = tenantUser ? tenantUser.roles : []

    // If the user is only invited,
    // tenant members can only see its email
    const otherData = status === 'active' ? user : {}

    return {
      ...otherData,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      status,
      invitationToken: tenantUser?.invitationToken,
    }
  }
}
