import assert from 'assert'
import { Error400 } from '@crowd/common'
import Roles from '../../security/roles'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import UserRepository from '../../database/repositories/userRepository'
import TenantUserRepository from '../../database/repositories/tenantUserRepository'
import Plans from '../../security/plans'
import { IServiceOptions } from '../IServiceOptions'

/**
 * Handles the edition of the user(s) via the User page.
 */
export default class UserEditor {
  options: IServiceOptions

  data

  transaction

  user

  constructor(options) {
    this.options = options
  }

  /**
   * Updates a user via the User page.
   */
  async update(data) {
    this.data = data

    await this._validate()

    try {
      this.transaction = await SequelizeRepository.createTransaction(this.options)

      await this._loadUser()
      await this._updateAtDatabase()

      await SequelizeRepository.commitTransaction(this.transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(this.transaction)

      throw error
    }
  }

  get _roles() {
    if (this.data.roles && !Array.isArray(this.data.roles)) {
      return [this.data.roles]
    }
    const uniqueRoles = [...new Set(this.data.roles)]
    return uniqueRoles
  }

  /**
   * Loads the user and validate that it exists.
   */
  async _loadUser() {
    this.user = await UserRepository.findById(this.data.id, this.options)

    if (!this.user) {
      throw new Error400(this.options.language, 'user.errors.userNotFound')
    }
  }

  /**
   * Updates the user at the database.
   */
  async _updateAtDatabase() {
    await TenantUserRepository.updateRoles(
      this.options.currentTenant.id,
      this.data.id,
      this.data.roles,
      this.options,
    )
  }

  /**
   * Checks if the user is removing the responsable for the plan
   */
  async _isRemovingPlanUser() {
    if (this._roles.includes(Roles.values.admin)) {
      return false
    }

    const { currentTenant } = this.options

    if (currentTenant.plan === Plans.values.essential) {
      return false
    }

    if (!currentTenant.planUserId) {
      return false
    }

    return String(this.data.id) === String(currentTenant.planUserId)
  }

  /**
   * Checks if the user is removing it's own admin role
   */
  async _isRemovingOwnAdminRole() {
    if (this._roles.includes(Roles.values.admin)) {
      return false
    }

    if (String(this.data.id) !== String(this.options.currentUser.id)) {
      return false
    }

    const tenantUser = this.options.currentUser.tenants.find(
      (userTenant) => userTenant.tenant.id === this.options.currentTenant.id,
    )

    return tenantUser.roles.includes(Roles.values.admin)
  }

  async _validate() {
    assert(this.options.currentTenant.id, 'tenantId is required')

    assert(this.options.currentUser, 'currentUser is required')
    assert(this.options.currentUser.id, 'currentUser.id is required')
    assert(this.options.currentUser.email, 'currentUser.email is required')

    assert(this.data.id, 'id is required')
    assert(this._roles, 'roles is required (can be empty)')

    if (await this._isRemovingPlanUser()) {
      throw new Error400(this.options.language, 'user.errors.revokingPlanUser')
    }

    if (await this._isRemovingOwnAdminRole()) {
      throw new Error400(this.options.language, 'user.errors.revokingOwnPermission')
    }
  }
}
