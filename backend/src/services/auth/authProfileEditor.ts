import assert from 'assert'

import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import UserRepository from '../../database/repositories/userRepository'
import { IServiceOptions } from '../IServiceOptions'

export default class AuthProfileEditor {
  options: IServiceOptions

  transaction

  data

  constructor(options) {
    this.options = options
    this.transaction = null
  }

  async execute(data) {
    this.data = data

    await this._validate()

    try {
      this.transaction = await SequelizeRepository.createTransaction(this.options)

      await UserRepository.updateProfile(this.options.currentUser.id, this.data, {
        ...this.options,
        bypassPermissionValidation: true,
      })

      await SequelizeRepository.commitTransaction(this.transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(this.transaction)
      throw error
    }
  }

  async _validate() {
    assert(this.options.currentUser, 'currentUser is required')
    assert(this.options.currentUser.id, 'currentUser.id is required')
    assert(this.options.currentUser.email, 'currentUser.email is required')

    assert(this.data, 'profile is required')
  }
}
