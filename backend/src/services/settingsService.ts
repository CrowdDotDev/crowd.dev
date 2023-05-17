import SequelizeRepository from '../database/repositories/sequelizeRepository'
import SettingsRepository from '../database/repositories/settingsRepository'
import Error400 from '../errors/Error400'

const DEFAULT_SETTINGS = {}

class SettingsService {
  static async findOrCreateDefault(options) {
    return SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)
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
