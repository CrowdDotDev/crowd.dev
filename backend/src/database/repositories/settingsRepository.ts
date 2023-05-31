import lodash from 'lodash'
import _get from 'lodash/get'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import { ActivityTypeSettings } from '@crowd/types'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import { IRepositoryOptions } from './IRepositoryOptions'

export default class SettingsRepository {
  static async findOrCreateDefault(defaults, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)
    const [settings] = await options.database.settings.findOrCreate({
      where: { id: tenant.id, tenantId: tenant.id },
      defaults: {
        ...defaults,
        id: tenant.id,
        tenantId: tenant.id,
        createdById: currentUser ? currentUser.id : null,
      },
      transaction: SequelizeRepository.getTransaction(options),
    })

    return this._populateRelations(settings)
  }

  static async save(data, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    data.backgroundImageUrl = _get(data, 'backgroundImages[0].downloadUrl', null)
    data.logoUrl = _get(data, 'logos[0].downloadUrl', null)
    if (
      typeof data.slackWebHook !== 'string' ||
      (typeof data.slackWebHook === 'string' && !data.slackWebHook?.startsWith('https://'))
    ) {
      data.slackWebHook = undefined
    }

    const [settings] = await options.database.settings.findOrCreate({
      where: { id: tenant.id, tenantId: tenant.id },
      defaults: {
        ...data,
        id: tenant.id,
        tenantId: tenant.id,
        createdById: currentUser ? currentUser.id : null,
      },
      transaction,
    })

    await settings.update(data, {
      transaction,
    })

    await AuditLogRepository.log(
      {
        entityName: 'settings',
        entityId: settings.id,
        action: AuditLogRepository.UPDATE,
        values: data,
      },
      options,
    )

    return this._populateRelations(settings)
  }

  static async getTenantSettings(tenantId: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const settings = await options.database.settings.findOne({
      where: { tenantId },
      transaction,
    })

    return settings
  }

  static buildActivityTypes(record: any): ActivityTypeSettings {
    const activityTypes = {} as ActivityTypeSettings

    activityTypes.default = lodash.cloneDeep(DEFAULT_ACTIVITY_TYPE_SETTINGS)
    activityTypes.custom = {}

    if (Object.keys(record.customActivityTypes).length > 0) {
      activityTypes.custom = record.customActivityTypes
    }

    return activityTypes
  }

  static getActivityChannels(options: IRepositoryOptions) {
    return options.currentTenant?.settings[0]?.activityChannels
  }

  static getActivityTypes(options: IRepositoryOptions): ActivityTypeSettings {
    return options.currentTenant?.settings[0]?.dataValues.activityTypes
  }

  static activityTypeExists(platform: string, key: string, options: IRepositoryOptions): boolean {
    const activityTypes = this.getActivityTypes(options)

    if (
      (activityTypes.default[platform] && activityTypes.default[platform][key]) ||
      (activityTypes.custom[platform] && activityTypes.custom[platform][key])
    ) {
      return true
    }

    return false
  }

  static async _populateRelations(record) {
    if (!record) {
      return record
    }

    const settings = record.get({ plain: true })

    settings.activityTypes = this.buildActivityTypes(record)
    settings.slackWebHook = !!settings.slackWebHook

    return settings
  }
}
