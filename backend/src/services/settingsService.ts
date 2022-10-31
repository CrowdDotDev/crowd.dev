import SequelizeRepository from '../database/repositories/sequelizeRepository'
import SettingsRepository from '../database/repositories/settingsRepository'

const DEFAULT_SETTINGS = {}

class SettingsService {
  static async findOrCreateDefault(options) {
    return SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)
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
