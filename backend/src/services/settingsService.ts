import { ActivityTypeSettings, PlatformType } from '@crowd/types'
import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import SettingsRepository from '../database/repositories/settingsRepository'
import Error400 from '../errors/Error400'

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

    const typeKey = data.type.toLowerCase()
    const platformKey = platform.toLowerCase()

    const activityTypes = SettingsRepository.getActivityTypes(options)

    if (!activityTypes.custom[platformKey]) {
      activityTypes.custom[platformKey] = {}
    }

    // check key already exists
    if (activityTypes.custom && activityTypes.custom[platformKey][typeKey]) {
      return activityTypes
    }

    activityTypes.custom[platformKey][typeKey] = {
      display: {
        default: data.type,
        short: data.type,
        channel: '',
      },
      isContribution: false,
    }

    const updated = await SettingsRepository.save(
      {
        ...options.currentTenant.settings[0].dataValues,
        slackWebHook: undefined,
        customActivityTypes: activityTypes.custom,
      },
      options,
    )

    return updated.activityTypes
  }

  /**
   * update activity channels after checking for duplicates with platform key
   */
  static async updateActivityChannels(data, options) {
    if (!data.channel) {
      throw new Error400(
        options.language,
        'settings.activityChannels.errors.typeRequiredWhenCreating',
      )
    }

    const activityChannels = SettingsRepository.getActivityChannels(options)

    if (activityChannels[data.platform]) {
      const channelList = activityChannels[data.platform]
      if (!channelList.includes(data.channel)) {
        const updatedChannelList = [...channelList, data.channel]
        activityChannels[data.platform] = updatedChannelList
      }
    } else {
      activityChannels[data.platform] = [data.channel]
    }
    const updated = await SettingsRepository.save(
      {
        activityChannels,
      },
      options,
    )
    return updated.activityChannels
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
    return Object.keys(activityTypes.custom)
      .filter((k) => activityTypes.custom[k])
      .reduce((acc, platform) => {
        const unnestWithPlatform = Object.keys(activityTypes.custom[platform]).reduce(
          (acc2, key) => {
            acc2[key] = { ...activityTypes.custom[platform][key], platform }
            return acc2
          },
          {},
        )

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
      display: {
        default: data.type,
        short: data.type,
        channel: '',
      },
      isContribution: false,
    }

    const updated = await SettingsRepository.save(
      {
        ...options.currentTenant.settings[0].dataValues,
        slackWebHook: undefined,
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
          slackWebHook: undefined,
          customActivityTypes: activityTypes.custom,
        },
        options,
      )
      return updated.activityTypes
    }

    return activityTypes
  }

  static listActivityTypes(options): ActivityTypeSettings {
    return SettingsRepository.getActivityTypes(options)
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
