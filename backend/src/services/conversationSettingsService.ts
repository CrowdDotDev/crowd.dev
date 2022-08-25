import Axios from 'axios'
import lodash from 'lodash'
import { IServiceOptions } from './IServiceOptions'
import ConversationSettingsRepository from '../database/repositories/conversationSettingsRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { getConfig } from '../config'

const DEFAULT_CONVERSATION_SETTINGS = {}

export default class ConversationSettingsService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  static async findOrCreateDefault(options) {
    return ConversationSettingsRepository.findOrCreateDefault(
      DEFAULT_CONVERSATION_SETTINGS,
      options,
    )
  }

  static async save(data, options) {
    const transaction = await SequelizeRepository.createTransaction(options.database)

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
          Authorization: `Bearer ${getConfig().NETLIFY_API_KEY}`,
        },
      })
      const { data: netlifySites } = await netlifyClient.get('sites')
      const netlifySite = netlifySites.find(
        (s) => s.custom_domain === getConfig().NETLIFY_SITE_DOMAIN,
      )
      const domainAliases = [...netlifySite.domain_aliases, domain]
      await netlifyClient.patch(`sites/${netlifySite.id}`, {
        domain_aliases: domainAliases,
      })
    } catch (error) {
      console.log(error)
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
