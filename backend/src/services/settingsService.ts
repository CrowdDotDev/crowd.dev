import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import SettingsRepository from '../database/repositories/settingsRepository'
import Error400 from '../errors/Error400'
import { ActivityTypeSettings } from '../types/activityTypes'
import { PlatformType } from '../types/integrationEnums'
import getCleanString from '../utils/getCleanString'

const DEFAULT_SETTINGS = {}

interface UnnestedActivityTypes {
  [key: string]: any
}

class SettingsService {
  static async findOrCreateDefault(options) {
    return SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)
  }

  static async createActivityType(data, options, platform: string = PlatformType.OTHER) {
    if (!data.type) {
      throw new Error400(options.language, 'settings.activityTypes.errors.typeRequiredWhenCreating')
    }

    const typeKey = getCleanString(data.type).replace(/ +/gi, '-')

    const activityTypes = SettingsRepository.getActivityTypes(options)

    if (!activityTypes.custom[platform]) {
      activityTypes.custom[platform] = {}
    }

    // check key already exists
    if (activityTypes.custom && activityTypes.custom[platform][typeKey]) {
      return activityTypes
    }

    activityTypes.custom[platform][typeKey] = {
      default: data.type,
      short: data.type,
      channel: '',
    }

    const updated = await SettingsRepository.save(
      {
        ...options.currentTenant.settings[0].dataValues,
        customActivityTypes: activityTypes.custom,
      },
      options,
    )

    return updated.activityTypes
  }

  /**
   * unnest activity types with platform for easy access/manipulation
   * custom : {
   *    platform: {
   *         type1: settings1,
   *         type2: settings2
   *    }
   * }
   *
   * is transformed into
   * {
   *    type1: {...settings1, platform},
   *    type2: {...settings2, platform}
   * }
   *
   */
  static unnestActivityTypes(activityTypes: ActivityTypeSettings): UnnestedActivityTypes {
    return Object.keys(activityTypes.custom).reduce((acc, platform) => {
      const unnestWithPlatform = Object.keys(activityTypes.custom[platform]).reduce((acc2, key) => {
        acc2[key] = { ...activityTypes.custom[platform][key], platform }
        return acc2
      }, {})

      acc = { ...acc, ...unnestWithPlatform }
      return acc
    }, {})
  }

  static async updateActivityType(key: string, data, options: IRepositoryOptions) {
    if (!data.type) {
      throw new Error400(options.language, 'settings.activityTypes.errors.typeRequiredWhenUpdating')
    }

    const activityTypes = SettingsRepository.getActivityTypes(options)

    const activityTypesUnnested = this.unnestActivityTypes(activityTypes)

    // if key doesn't exist, throw 400
    if (!activityTypesUnnested[key]) {
      throw new Error400(options.language, 'settings.activityTypes.errors.notFound', key)
    }

    activityTypes.custom[activityTypesUnnested[key].platform][key] = {
      default: data.type,
      short: data.type,
      channel: '',
    }

    const updated = await SettingsRepository.save(
      {
        ...options.currentTenant.settings[0].dataValues,
        customActivityTypes: activityTypes.custom,
      },
      options,
    )

    return updated.activityTypes
  }

  static async destroyActivityType(key: string, options): Promise<ActivityTypeSettings> {
    const activityTypes = SettingsRepository.getActivityTypes(options)

    const activityTypesUnnested = this.unnestActivityTypes(activityTypes)

    if (activityTypesUnnested[key]) {
      delete activityTypes.custom[activityTypesUnnested[key].platform][key]
      const updated = await SettingsRepository.save(
        {
          ...options.currentTenant.settings[0].dataValues,
          customActivityTypes: activityTypes.custom,
        },
        options,
      )
      return updated.activityTypes
    }

    return activityTypes
  }

  static async save(data, options) {
    const transaction = await SequelizeRepository.createTransaction(options)

    const settings = await SettingsRepository.save(data, options)

    await SequelizeRepository.commitTransaction(transaction)

    return settings
  }

  static async platformPriorityArrayExists(options) {
    const settings = await SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)
    return (
      settings.attributeSettings &&
      settings.attributeSettings.priorities &&
      settings.attributeSettings.priorities.length > 0
    )
  }
}

export default SettingsService
