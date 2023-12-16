import assert from 'assert'
import { Error400 } from '@crowd/common'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import UserRepository from '../../database/repositories/userRepository'
import TenantUserRepository from '../../database/repositories/tenantUserRepository'
import Plans from '../../security/plans'
import { IServiceOptions } from '../IServiceOptions'

/**
 * Handles removing the permissions of the users.
 */
export default class UserDestroyer {
  options: IServiceOptions

  transaction

  data

  constructor(options) {
    this.options = options
  }

  /**
   * Removes all passed users.
   */
  async destroyAll(data) {
    this.data = data

    await this._validate()

    try {
      this.transaction = await SequelizeRepository.createTransaction(this.options)

      await Promise.all(this._ids.map((id) => this._destroy(id)))

      return await SequelizeRepository.commitTransaction(this.transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(this.transaction)
      throw error
    }
  }

  get _ids() {
    let ids

    if (this.data.ids && !Array.isArray(this.data.ids)) {
      ids = [this.data.ids]
    } else {
      const uniqueIds = [...new Set(this.data.ids)]
      ids = uniqueIds
    }

    return ids.map((id) => id.trim())
  }

  async _destroy(id) {
    const user = await UserRepository.findByIdWithoutAvatar(id, this.options)

    await TenantUserRepository.destroy(this.options.currentTenant.id, user.id, this.options)
  }

  /**
   * Checks if the user is removing the responsable for the plan
   */
  async _isRemovingPlanUser() {
    const { currentTenant } = this.options

    if (currentTenant.plan === Plans.values.essential) {
      return false
    }

    if (!currentTenant.planUserId) {
      return false
    }

    return this._ids.includes(String(currentTenant.planUserId))
  }

  /**
   * Checks if the user is removing himself
   */
  _isRemovingHimself() {
    return this._ids.includes(String(this.options.currentUser.id))
  }

  async _validate() {
    assert(this.options.currentTenant.id, 'tenantId is required')
    assert(this.options.currentUser, 'currentUser is required')
    assert(this.options.currentUser.id, 'currentUser.id is required')
    assert(this.options.currentUser.email, 'currentUser.email is required')
    assert(this._ids && this._ids.length, 'ids is required')

    if (await this._isRemovingPlanUser()) {
      throw new Error400(this.options.language, 'user.errors.destroyingPlanUser')
    }

    if (this._isRemovingHimself()) {
      throw new Error400(this.options.language, 'user.errors.destroyingHimself')
    }
  }
}
