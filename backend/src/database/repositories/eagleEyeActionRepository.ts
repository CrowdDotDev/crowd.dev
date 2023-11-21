import lodash from 'lodash'
import { EagleEyeAction, EagleEyeActionType } from '@crowd/types'
import { Error404 } from '@crowd/common'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class EagleEyeActionRepository {
  static async createActionForContent(
    data: EagleEyeAction,
    contentId: string,
    options: IRepositoryOptions,
  ): Promise<EagleEyeAction> {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeAction.create(
      {
        ...lodash.pick(data, ['type', 'timestamp']),
        actionById: currentUser.id,
        contentId,
        tenantId: currentTenant.id,
      },
      {
        transaction,
      },
    )

    return this.findById(record.id, options)
  }

  static async removeActionFromContent(
    action: EagleEyeActionType,
    contentId: string,
    options: IRepositoryOptions,
  ) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.eagleEyeAction.findOne({
      where: {
        contentId,
        action,
        actionById: currentUser.id,
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

  static async destroy(id: string, options: IRepositoryOptions): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeAction.findOne({
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

  static async findById(id: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeAction.findOne({
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

  static async create(data: EagleEyeAction, options: IRepositoryOptions): Promise<EagleEyeAction> {
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = options.database.eagleEyeContent.create({
      ...lodash.pick(data, ['type', 'timestamp']),
      tenantId: currentTenant.id,
    })

    return this.findById(record.id, options)
  }

  static async _populateRelations(record) {
    if (!record) {
      return record
    }

    return record.get({ plain: true })
  }
}
