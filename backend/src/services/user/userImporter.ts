import { Error400 } from '@crowd/common'
import UserRepository from '../../database/repositories/userRepository'
import UserCreator from './userCreator'
import { IServiceOptions } from '../IServiceOptions'

/**
 * Flags if should send invitation emails for imported users.
 */
const SEND_INVITATION_EMAIL = false

export default class UserImporter {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      emails: [data.email],
      ...data,
      importHash,
    }

    return new UserCreator(this.options).execute(dataToCreate, SEND_INVITATION_EMAIL)
  }

  async _isImportHashExistent(importHash) {
    const count = await UserRepository.count(
      {
        importHash,
      },
      this.options,
    )
    return count > 0
  }
}
