import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import moment from 'moment'
import axios from 'axios'
import lodash from 'lodash'
import { KUBE_MODE, GITHUB_CONFIG, IS_TEST_ENV } from '../config/index'
import {
  DevtoIntegrationMessage,
  DiscordIntegrationMessage,
  IntegrationsMessage,
} from '../serverless/integrations/types/messageTypes'
import Error400 from '../errors/Error400'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import Error542 from '../errors/Error542'
import send from '../serverless/integrations/utils/integrationSQS'
import track from '../segment/track'
import { PlatformType } from '../utils/platforms'
import { getInstalledRepositories } from '../serverless/integrations/usecases/github/rest/getInstalledRepositories'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessage, NodeWorkerMessageType } from '../serverless/types/workerTypes'

export default class IntegrationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async createOrUpdate(data) {
    try {
      const record = await IntegrationRepository.findByPlatform(data.platform, { ...this.options })
      const updatedRecord = await this.update(record.id, data)
      if (!IS_TEST_ENV) {
        track(
          'Integration Updated',
          {
            id: data.id,
            platform: data.platform,
            status: data.status,
          },
          { ...this.options },
        )
      }
      return updatedRecord
    } catch (error) {
      if (error.code === 404) {
        const record = await this.create(data)
        if (!IS_TEST_ENV) {
          track(
            'Integration Created',
            {
              id: data.id,
              platform: data.platform,
              status: data.status,
            },
            { ...this.options },
          )
        }
        return record
      }
      throw error
    }
  }

  /**
   * Find all active integrations for a tenant
   * @returns The active integrations for a tenant
   */
  async getAllActiveIntegrations() {
    return IntegrationRepository.findAndCountAll({ filter: { status: 'done' } }, this.options)
  }

  async findByPlatform(platform) {
    return IntegrationRepository.findByPlatform(platform, this.options)
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await IntegrationRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)
      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'integration')

      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await IntegrationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'integration')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await IntegrationRepository.destroy(id, {
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
    return IntegrationRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return IntegrationRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return IntegrationRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return IntegrationRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
      this.options,
    )
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.create(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await IntegrationRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }

  /**
   * Returns installation access token for a Github App installation
   * @param installId Install id of the Github app
   * @returns Installation authentication token
   */
  static async getInstallToken(installId) {
    let privateKey = GITHUB_CONFIG.privateKey

    if (KUBE_MODE) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    const auth = createAppAuth({
      appId: GITHUB_CONFIG.appId,
      privateKey,
      clientId: GITHUB_CONFIG.clientId,
      clientSecret: GITHUB_CONFIG.clientSecret,
    })

    // Retrieve installation access token
    const installationAuthentication = await auth({
      type: 'installation',
      installationId: installId,
    })

    return installationAuthentication.token
  }

  /**
   * Adds github integration to a tenant and calls the onboarding SOA endpoint
   * @param code Temporary code generated by github after authorize
   * @param tenantId Tenant.id
   * @param installId Install id of the Crowd Github app
   * @returns integration object
   */
  async connectGithub(code, installId, setupAction = 'install') {
    if (setupAction === 'request') {
      return this.createOrUpdate({
        platform: PlatformType.GITHUB,
        status: 'waiting-approval',
      })
    }

    const GITHUB_AUTH_ACCESSTOKEN_URL = 'https://github.com/login/oauth/access_token'
    // Getting the GitHub client ID and secret from the .env file.
    const CLIENT_ID = GITHUB_CONFIG.clientId
    const CLIENT_SECRET = GITHUB_CONFIG.clientSecret
    // Post to GitHub to get token
    const tokenResponse = await axios({
      method: 'post',
      url: GITHUB_AUTH_ACCESSTOKEN_URL,
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
    })

    // Doing some processing on the token
    let token = tokenResponse.data
    token = token.slice(token.search('=') + 1, token.search('&'))

    try {
      const requestWithAuth = request.defaults({
        headers: {
          authorization: `token ${token}`,
        },
      })
      await requestWithAuth('GET /user')
    } catch {
      throw new Error542(
        `Invalid token for GitHub integration. Code: ${code}, setupAction: ${setupAction}. Token: ${token}`,
      )
    }

    // Using try/catch since we want to return an error if the installation is not validated properly
    // Fetch install token from GitHub, this will allow us to get the
    // repos that the user gave us access to
    const installToken = await IntegrationService.getInstallToken(installId)

    const repos = await getInstalledRepositories(installToken)

    const integration = await this.createOrUpdate({
      platform: PlatformType.GITHUB,
      token,
      settings: { repos, updateMemberAttributes: true },
      integrationIdentifier: installId,
      status: 'in-progress',
    })

    const integrationsMessageBody: IntegrationsMessage = {
      integration: PlatformType.GITHUB,
      state: {
        endpoint: '',
        page: '',
        endpoints: [],
      },
      tenant: integration.tenantId.toString(),
      sleep: 0,
      onboarding: true,
      args: {},
    }

    // TODO-kube
    if (KUBE_MODE) {
      const payload = {
        type: NodeWorkerMessageType.INTEGRATION,
        ...integrationsMessageBody,
      }
      await sendNodeWorkerMessage(integration.tenantId.toString(), payload as NodeWorkerMessage)
    } else {
      await send(integrationsMessageBody)
    }

    return integration
  }

  /**
   * Adds discord integration to a tenant
   * @param guildId Guild id of the discord server
   * @returns integration object
   */
  async discordConnect(guildId) {
    let integration = await this.createOrUpdate({
      platform: PlatformType.DISCORD,
      integrationIdentifier: guildId,
    })
    const isOnboarding: boolean = !('channels' in integration.settings)

    const channels = isOnboarding ? [] : integration.settings.channels ?? []

    integration = await this.createOrUpdate({
      platform: PlatformType.DISCORD,
      integrationIdentifier: guildId,
      settings: { channels, updateMemberAttributes: true },
      status: 'in-progress',
    })

    // Preparing a message to start fetching activities
    const integrationsMessageBody: DiscordIntegrationMessage = {
      integration: PlatformType.DISCORD,
      state: {
        endpoint: '',
        page: '',
        endpoints: [],
      },
      tenant: integration.tenantId.toString(),
      sleep: 0,
      onboarding: isOnboarding, // Full onboarding can also be deactivated from env
      args: {
        guildId,
        channels,
      },
    }

    integration = await this.createOrUpdate({
      platform: PlatformType.DISCORD,
      integrationIdentifier: guildId,
      settings: { channels, updateMemberAttributes: true },
      status: 'in-progress',
    })

    // TODO-kube
    if (KUBE_MODE) {
      const payload = {
        type: NodeWorkerMessageType.INTEGRATION,
        ...integrationsMessageBody,
      }

      await sendNodeWorkerMessage(integration.tenantId.toString(), payload as NodeWorkerMessage)
    } else {
      await send(integrationsMessageBody)
    }

    return integration
  }

  /**
   * Adds/updates Dev.to integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async devtoConnectOrUpdate(integrationData) {
    const integration = await this.createOrUpdate({
      platform: PlatformType.DEVTO,
      settings: {
        users: integrationData.users,
        organizations: integrationData.organizations,
        articles: [],
        updateMemberAttributes: true,
      },
      status: 'in-progress',
    })

    const mqMessage: DevtoIntegrationMessage = {
      integration: PlatformType.DEVTO,
      sleep: 0,
      integrationId: integration.id,
      tenant: integration.tenantId.toString(),
      onboarding: true,
      state: { endpoint: '', page: '', endpoints: [] },
      args: {},
    }

    // TODO-kube
    if (KUBE_MODE) {
      const payload = {
        type: NodeWorkerMessageType.INTEGRATION,
        ...mqMessage,
      }

      await sendNodeWorkerMessage(integration.tenantId.toString(), payload as NodeWorkerMessage)
    } else {
      await send(mqMessage)
    }

    return integration
  }

  /**
   * Adds/updates slack integration
   * @param integrationData to create the integration object
   * @returns integration object
   */
  async slackCallback(integrationData) {
    let integration = await this.createOrUpdate({
      platform: PlatformType.SLACK,
      ...integrationData,
    })

    const isOnboarding: boolean = !('channels' in integration.settings)

    // Preparing a message to start fetching activities
    const integrationsMessageBody: IntegrationsMessage = {
      integration: PlatformType.SLACK,
      state: {
        endpoint: '',
        page: '',
        endpoints: [],
      },
      tenant: integration.tenantId.toString(),
      sleep: 0,
      onboarding: isOnboarding, // Full onboarding can also be deactivated from env
      args: {},
    }

    integration.settings.updateMemberAttributes = true

    integration = await this.createOrUpdate({
      platform: PlatformType.SLACK,
      status: 'in-progress',
      settings: integration.settings,
    })

    // TODO-kube
    if (KUBE_MODE) {
      const payload = {
        type: NodeWorkerMessageType.INTEGRATION,
        ...integrationsMessageBody,
      }
      await sendNodeWorkerMessage(integration.tenantId.toString(), payload as NodeWorkerMessage)
    } else {
      await send(integrationsMessageBody)
    }

    return integration
  }

  /**
   * Adds/updates twitter integration
   * @param integrationData to create the integration object
   * @returns integration object
   */
  async twitterCallback(integrationData) {
    let { hashtags } = integrationData
    const { profileId, token, refreshToken } = integrationData

    let integration = await this.createOrUpdate({
      platform: PlatformType.TWITTER,
      integrationIdentifier: profileId,
      token,
      refreshToken,
    })

    if (!integration.limitCount) {
      integration.limitCount = 0
    }
    if (!integration.limitLastResetAt) {
      integration.limitLastResetAt = moment().format('YYYY-MM-DD HH:mm:ss')
    }

    // Hashtags cannot be null, it should be an empty list if no hashtags were added
    hashtags = hashtags || []
    integration.settings.hashtags = hashtags
    integration.settings.updateMemberAttributes = true

    let isOnboarding: boolean = true
    if (hashtags.length > 0 && lodash.isEqual(hashtags, integration.settings.hashtags)) {
      isOnboarding = false
    }

    // Preparing a message to start fetching activities
    const integrationsMessageBody: IntegrationsMessage = {
      integration: PlatformType.TWITTER,
      state: {
        endpoint: '',
        page: '',
        endpoints: [],
      },
      tenant: integration.tenantId.toString(),
      sleep: 0,
      onboarding: isOnboarding, // Full onboarding can also be deactivated from env
      args: {
        profileId,
        hashtags,
      },
    }

    integration = await this.update(integration.id, {
      limitCount: integration.limitCount,
      limitLastResetAt: integration.limitLastResetAt,
      settings: integration.settings,
      status: 'in-progress',
    })

    // TODO-kube
    if (KUBE_MODE) {
      const payload = {
        type: NodeWorkerMessageType.INTEGRATION,
        ...integrationsMessageBody,
      }

      await sendNodeWorkerMessage(integration.tenantId.toString(), payload as NodeWorkerMessage)
    } else {
      await send(integrationsMessageBody)
    }

    return integration
  }
}
