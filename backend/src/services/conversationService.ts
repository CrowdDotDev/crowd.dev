import { getCleanString } from '@crowd/common'
import { LoggerBase } from '@crowd/logging'
import emoji from 'emoji-dictionary'
import { convert as convertHtmlToText } from 'html-to-text'
import moment from 'moment'
import fetch from 'node-fetch'
import { Transaction } from 'sequelize/types'
import { PlatformType } from '@crowd/types'
import { IS_TEST_ENV, S3_CONFIG } from '../conf/index'
import ConversationRepository from '../database/repositories/conversationRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import Error403 from '../errors/Error403'
import ConversationSearchEngineRepository from '../search-engine/repositories/conversationSearchEngineRepository'
import SettingsSearchEngineRepository from '../search-engine/repositories/settingsSearchEngineRepository'
import telemetryTrack from '../segment/telemetryTrack'
import track from '../segment/track'
import { IServiceOptions } from './IServiceOptions'
import { s3 } from './aws'
import ConversationSettingsService from './conversationSettingsService'
import getStage from './helpers/getStage'
import IntegrationService from './integrationService'
import SettingsService from './settingsService'
import TenantService from './tenantService'

export default class ConversationService extends LoggerBase {
  static readonly MAX_SLUG_WORD_LENGTH = 10

  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await ConversationRepository.create(data, {
        ...this.options,
        transaction,
      })

      telemetryTrack(
        'Conversation created',
        {
          id: record.id,
          createdAt: record.createdAt,
          platform: data.platform || 'unknown',
        },
        this.options,
      )

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'conversation')

      throw error
    }
  }

  /**
   * Updates general conversation settings for a tenant
   * Example data payload:
   * {
   *    tenant:{
   *       name: 'tenantName'
   *       url: 'tenantSlug'
   *    }
   *    inviteLinks:{
   *       discord: 'some-url'
   *       slack: 'some-url'
   *    }
   *    website: 'some-website',
   *    theme: {
   *      text: “#FFDD75”,
   *     	textSecondary: “#A1B6A1",
   *      textCta: “#D93920”,
   *      bg: “#081C08",
   *      bgHighlight: “#144914”,
   *      bgNav: “#193ED2",
   *    },
   *    customUrl: 'some-url',
   *    logoUrl: 'some-url',
   *    faviconUrl: 'some-url',
   * }
   * If tenant already has published conversations,
   * updating tenant.url is not allowed.
   *
   * @param data settings payload
   * @returns settings object that will be sent to search engine
   */
  async updateSettings(data) {
    const tenantService = new TenantService(this.options)
    const integrationService = new IntegrationService(this.options)
    let tenant
    let settings
    let conversationSettings = await ConversationSettingsService.findOrCreateDefault(this.options)

    if (data.tenant) {
      tenant = await tenantService.update(this.options.currentTenant.id, data.tenant)
    }

    if (data.inviteLinks) {
      for (const platform in data.inviteLinks) {
        if (Object.prototype.hasOwnProperty.call(data.inviteLinks, platform)) {
          // find the integration
          const integration = (
            await integrationService.findAndCountAll({
              filter: { platform },
            })
          ).rows[0]
          await integrationService.update(integration.id, {
            settings: { ...integration.settings, inviteLink: data.inviteLinks[platform] },
          })
        }
      }
    }

    if (data.website) {
      settings = await SettingsService.save({ website: data.website }, this.options)
    }

    if (data.customUrl || data.logoUrl || data.faviconUrl || data.theme || data.autoPublish) {
      if (data.customUrl) {
        await ConversationSettingsService.updateCustomDomainNetlify(data.customUrl)
      }

      if (
        data.autopubLish &&
        data.autoPublish.status &&
        ConversationSettingsService.isAutoPublishUpdated(
          data.autoPublish,
          conversationSettings.autoPublish,
        )
      ) {
        await this.autoPublishPastConversations(data.autoPublish)
      }

      conversationSettings = await ConversationSettingsService.save(
        {
          enabled: data.enabled,
          customUrl: data.customUrl,
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
          theme: data.theme,
          autoPublish: data.autoPublish,
        },
        this.options,
      )
    }

    const activeIntegrations = await integrationService.getAllActiveIntegrations()

    const inviteLinks = activeIntegrations.rows.reduce((acc, i) => {
      acc[i.platform] = i.settings && i.settings.inviteLink ? i.settings.inviteLink : undefined
      return acc
    }, {})

    tenant = await tenantService.findById(this.options.currentTenant.id, this.options)

    settings = await SettingsService.findOrCreateDefault(this.options)

    const settingsDocument = {
      id: tenant.id,
      tenantName: tenant.name,
      inviteLinks,
      website: settings.website ?? undefined,
      tenantSlug: tenant.url,
      enabled: conversationSettings.enabled ?? false,
      customUrl: conversationSettings.customUrl ?? undefined,
      logoUrl: conversationSettings.logoUrl ?? undefined,
      faviconUrl: conversationSettings.faviconUrl ?? undefined,
      theme: conversationSettings.theme ?? undefined,
      autoPublish: conversationSettings.autoPublish ?? undefined,
    }

    await new SettingsSearchEngineRepository(this.options).createOrReplace(settingsDocument)

    return settingsDocument
  }

  /**
   * Removes conversation document from search engine index
   */
  async removeFromSearchEngine(id: String, transaction: Transaction): Promise<void> {
    const conversation = await ConversationRepository.findById(id, { ...this.options, transaction })
    await new ConversationSearchEngineRepository(this.options).delete(conversation.id)
  }

  /**
   * Clean a channel of non-unicode characters and remove front and trailing dashes
   * @param channel Channel to clean
   * @returns Cleaned channel
   */
  static sanitizeChannel(channel) {
    const hasAlha = channel.replace(/[^a-z0-9]/gi, '') !== ''

    if (!hasAlha && /\p{Emoji}/u.test(channel)) {
      return [...channel]
        .filter((char) => /\p{Emoji}/u.test(char))
        .map((unicodeEmoji) => emoji.getName(unicodeEmoji))
        .join('-')
      // return emoji.getName(rawChannel) || 'no-channel'
    }

    return (
      channel
        .split('-')
        .map((word) => word.replace(/[^a-z0-9]/gi, ''))
        .filter((word) => word !== '' && word !== undefined)
        .join('-') || 'no-channel'
    )
  }

  static getChannelFromActivity(activity) {
    let channel = null

    if (activity.platform === PlatformType.DISCORD) {
      channel = activity.channel
    } else if (activity.platform === PlatformType.SLACK) {
      channel = activity.channel
    } else if (activity.platform === PlatformType.GITHUB) {
      const prefix = 'https://github.com/'
      if (activity.channel.startsWith(prefix)) {
        channel = activity.channel.slice(prefix.length).split('/')[1]
      } else {
        channel = activity.channel.split('/')[1]
      }
    } else {
      channel = activity.channel
    }

    return channel
  }

  /**
   * Will return true if:
   * - conversationSettings.autoPublish.status === 'all'
   * - conversationSettings.autoPublish.status === 'custom' and channel & platform exist within autoPublish.channelsByPlatform
   *
   * else returns false
   *
   * @param conversationSettings
   * @param platform
   * @param channel
   *
   * @returns shouldAutoPublish
   */
  static shouldAutoPublishConversation(conversationSettings, platform, channel) {
    let shouldAutoPublish = false

    if (!conversationSettings.autoPublish) {
      return shouldAutoPublish
    }

    if (conversationSettings.autoPublish.status === 'all') {
      shouldAutoPublish = true
    } else if (conversationSettings.autoPublish.status === 'custom') {
      shouldAutoPublish =
        conversationSettings.autoPublish.channelsByPlatform[platform] &&
        conversationSettings.autoPublish.channelsByPlatform[platform].includes(channel)
    }
    return shouldAutoPublish
  }

  async autoPublishPastConversations(dataAutoPublish) {
    const conversations = await ConversationRepository.findAndCountAll(
      {
        filter: {
          published: false,
        },
        lazyLoad: ['activities'],
      },
      this.options,
    )

    for (const conversation of conversations.rows) {
      if (
        ConversationService.shouldAutoPublishConversation(
          { autoPublish: dataAutoPublish },
          conversation.platform,
          conversation.channel,
        )
      ) {
        await this.update(conversation.id, { published: true })
      }
    }
  }

  /**
   * Loads given conversation into search engine index as a document
   * Filters out empty body and attachment activities in a conversation
   * @param id conversationId
   * @param transaction db transaction
   * @returns search index client index object
   */
  async loadIntoSearchEngine(id: String, transaction?: Transaction): Promise<void> {
    const conversation = await ConversationRepository.findById(id, { ...this.options, transaction })

    this.log.info({ conversation }, 'Found conversation!')

    let plainActivities = conversation.activities
      .map((act) => {
        act.timestamp = moment(act.timestamp).unix()
        act.author = act.username
        delete act.member
        delete act.display
        return act
      })
      .filter(
        (act) =>
          act.body !== '' || (act.attributes.attachments && act.attributes.attachments.length > 0),
      )

    if (plainActivities.length > 0) {
      // mark first(parent) activity as conversation starter for convenience
      plainActivities[0].conversationStarter = true

      const activitiesBodies = plainActivities.map((a) => a.body)

      const channel = ConversationService.getChannelFromActivity(plainActivities[0])
      if (plainActivities[0].platform === PlatformType.SLACK) {
        plainActivities = await this.downloadSlackAttachments(plainActivities)
      }

      const document = {
        id: conversation.id,
        tenantSlug: this.options.currentTenant.url,
        title: conversation.title,
        platform: plainActivities[0].platform,
        channel: ConversationService.sanitizeChannel(channel),
        slug: conversation.slug,
        activities: plainActivities,
        activitiesBodies,
        lastActive: plainActivities[plainActivities.length - 1].timestamp,
        views: 0,
        url: plainActivities[0].url,
      }

      this.log.info({ document }, 'Adding doc to conversation!')
      await new ConversationSearchEngineRepository(this.options).createOrReplace(document)
    }

    this.log.info(`Conversation ${id} doesn't have publishable activities.`)
  }

  /**
   * Downloads slack attachments and saves them to an S3 bucket
   * @param activities activities to download attachments for
   * @returns The same activities, but the attachment URL is replaced with a public S3 bucket URL
   */
  async downloadSlackAttachments(activities) {
    const integrationService = new IntegrationService(this.options)
    const token = (await integrationService.findByPlatform(PlatformType.SLACK)).token
    const headers = {
      Authorization: `Bearer ${token}`,
    }
    return Promise.all(
      activities.map(async (act) => {
        if (act.attributes.attachments && act.attributes.attachments.length > 0) {
          act.attributes.attachments = await Promise.all(
            act.attributes.attachments.map(async (attachment) => {
              if (attachment.mediaType === 'image/png') {
                // Get the file URL from the attachment ID
                const axios = require('axios')
                const configForUrl = {
                  method: 'get',
                  url: `https://slack.com/api/files.info?file=${attachment.id}`,
                  headers,
                }

                const response = await axios(configForUrl)
                const data = response.data

                if ((data.error && data.needed === 'files:read') || !data.ok) {
                  throw new Error403('en', 'errors.missingScopes.message', {
                    integration: 'Slack',
                    scopes: 'files:read',
                  })
                }

                this.log.info(
                  `trying to get bucket ${S3_CONFIG.integrationsAssetsBucket}-${getStage()}`,
                )

                const url = data.file.url_private

                // Get the image from the URL
                return fetch(url, {
                  method: 'POST',
                  headers,
                }).then(async (res) => {
                  const objectParams = {
                    Bucket: `${S3_CONFIG.integrationsAssetsBucket}-${getStage()}`,
                    ContentType: 'image/png',
                    Body: res.body,
                    Key: `slack/${attachment.id}.png`,
                  }
                  // Upload the image to S3
                  const data = await s3.upload(objectParams).promise()
                  attachment.url = data.Location.replace(
                    'http://localstack',
                    'https://localhost.localstack.cloud',
                  )
                  return attachment
                })
              }
              return attachment
            }),
          )
          return act
        }
        return act
      }),
    )
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const recordBeforeUpdate = await ConversationRepository.findById(id, { ...this.options })
      const record = await ConversationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      if (
        (data.published === true || data.published === 'true') &&
        (record.published === true || record.published === 'true')
      ) {
        this.log.debug('Loading into search engine...')
        await this.loadIntoSearchEngine(record.id, transaction)
        this.log.debug('done!')

        if (recordBeforeUpdate.published !== record.published && !IS_TEST_ENV) {
          track('Conversation Published', { id: record.id }, { ...this.options })
        }
      }

      if (
        (data.published === false || data.published === 'false') &&
        (record.published === false || record.published === 'false')
      ) {
        await this.removeFromSearchEngine(record.id, transaction)
        if (recordBeforeUpdate.published !== record.published && !IS_TEST_ENV) {
          track('Conversation Unpublished', { id: record.id }, { ...this.options })
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'conversation')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await ConversationRepository.destroy(id, {
          ...this.options,
          transaction,
        })
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return ConversationRepository.findById(id, this.options)
  }

  async findAndCountAll(args) {
    return ConversationRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    const lazyLoad = ['activities']
    return ConversationRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset, lazyLoad },
      this.options,
    )
  }

  /**
   * Generates a clean title from given string
   * @param title string used to generate a cleaned title
   * @param isHtml whether the title param is html or plain text
   * @returns cleaned title
   */
  async generateTitle(title: string, isHtml: boolean = false): Promise<string> {
    if (!title || getCleanString(title) === '') {
      return `conversation-${await ConversationRepository.count({}, this.options)}`
    }

    if (isHtml) {
      // convert html to text
      const plainText = convertHtmlToText(title)
      // and remove new lines
      return plainText.replace(/\n/g, ' ')
    }

    return title
  }

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await ConversationRepository.destroyBulk(
        ids,
        {
          ...this.options,
          transaction,
        },
        true,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Generates a slug-like string from given title
   * If generated slug already exists for a tenant,
   * adds dashed suffixes until it finds a unique slug
   * @param title title used to generate slug-like string
   * @returns slug-like string
   *
   */
  async generateSlug(title: string): Promise<string> {
    // Remove non-standart characters and extra whitespaces
    const cleanedTitle = getCleanString(title)

    const slugArray = cleanedTitle.split(' ')
    let cleanedSlug = ''

    for (let i = 0; i < slugArray.length; i++) {
      if (i >= ConversationService.MAX_SLUG_WORD_LENGTH) {
        break
      }
      cleanedSlug += `${slugArray[i]}-`
    }

    // remove trailing dash
    cleanedSlug = cleanedSlug.replace(/-$/gi, '')

    // check generated slug already exists in tenant
    let checkSlug = await ConversationRepository.findAndCountAll(
      { filter: { slug: cleanedSlug } },
      this.options,
    )

    // generated slug already exists in the tenant, start adding suffixes and re-check
    if (checkSlug.count > 0) {
      let suffix = 1

      const slugCopy = cleanedSlug

      while (checkSlug.count > 0) {
        const suffixedSlug = `${slugCopy}-${suffix}`
        checkSlug = await ConversationRepository.findAndCountAll(
          { filter: { slug: suffixedSlug } },
          this.options,
        )
        suffix += 1
        cleanedSlug = suffixedSlug
      }
    }

    return cleanedSlug
  }
}
