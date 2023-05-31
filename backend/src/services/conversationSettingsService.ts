import Axios from 'axios'
import lodash from 'lodash'
import { LoggerBase, getServiceChildLogger } from '@crowd/logging'
import { NETLIFY_CONFIG } from '../conf/index'
import { IServiceOptions } from './IServiceOptions'
import ConversationSettingsRepository from '../database/repositories/conversationSettingsRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'

const DEFAULT_CONVERSATION_SETTINGS = {}

const log = getServiceChildLogger('ConversationSettingsService')

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

  static async updateCustomDomainNetlify(customUrl) {
    try {
      const domain =
        customUrl.indexOf('http') !== -1 ? customUrl : new URL(`https://${customUrl}`).hostname
      const netlifyClient = Axios.create({
        baseURL: 'https://api.netlify.com/api/v1/',
        headers: {
          Authorization: `Bearer ${NETLIFY_CONFIG.apiKey}`,
        },
      })
      const { data: netlifySites } = await netlifyClient.get('sites')
      const netlifySite = netlifySites.find((s) => s.custom_domain === NETLIFY_CONFIG.siteDomain)
      const domainAliases = [...netlifySite.domain_aliases, domain]
      await netlifyClient.patch(`sites/${netlifySite.id}`, {
        domain_aliases: domainAliases,
      })
    } catch (error) {
      log.error(error, 'Error updating custom netflify domain!')
      throw new Error(error.message)
    }
  }

  static isAutoPublishUpdated(dataAutoPublish, currentAutoPublish) {
    if (currentAutoPublish && dataAutoPublish.status === currentAutoPublish.status) {
      if (dataAutoPublish.status === 'all' || dataAutoPublish.status === 'disabled') {
        return false
      }
      // dataAutoPublish.status === 'custom'
      return !lodash.isEqual(
        dataAutoPublish.channelsByPlatform,
        currentAutoPublish.channelsByPlatform,
      )
    }
    return true
  }
}
