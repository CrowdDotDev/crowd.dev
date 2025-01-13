import { LoggerBase } from '@crowd/logging'

import ConversationSettingsRepository from '../database/repositories/conversationSettingsRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'

const DEFAULT_CONVERSATION_SETTINGS = {}

export default class ConversationSettingsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  static async findOrCreateDefault(options) {
    return ConversationSettingsRepository.findOrCreateDefault(
      DEFAULT_CONVERSATION_SETTINGS,
      options,
    )
  }

  static async save(data, options) {
    const transaction = await SequelizeRepository.createTransaction(options)

    const settings = await ConversationSettingsRepository.save(data, options)

    await SequelizeRepository.commitTransaction(transaction)

    return settings
  }
}
