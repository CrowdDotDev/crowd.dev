import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import moment from 'moment'
import axios from 'axios'
import { PlatformType } from '@crowd/types'
import {
  HubspotFieldMapperFactory,
  getHubspotProperties,
  getHubspotTokenInfo,
  IHubspotOnboardingSettings,
  IHubspotProperty,
  HubspotEntity,
  IHubspotTokenInfo,
  HubspotEndpoint,
  IHubspotManualSyncPayload,
} from '@crowd/integrations'
import { ILinkedInOrganization } from '../serverless/integrations/types/linkedinTypes'
import { DISCORD_CONFIG, GITHUB_CONFIG, IS_TEST_ENV, KUBE_MODE, NANGO_CONFIG } from '../conf/index'
import Error400 from '../errors/Error400'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import Error542 from '../errors/Error542'
import track from '../segment/track'
import { getInstalledRepositories } from '../serverless/integrations/usecases/github/rest/getInstalledRepositories'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../types/mq/nodeWorkerIntegrationProcessMessage'
import telemetryTrack from '../segment/telemetryTrack'
import getToken from '../serverless/integrations/usecases/nango/getToken'
import { getOrganizations } from '../serverless/integrations/usecases/linkedin/getOrganizations'
import Error404 from '../errors/Error404'
import IntegrationRunRepository from '../database/repositories/integrationRunRepository'
import { IntegrationRunState } from '../types/integrationRunTypes'
import { getIntegrationRunWorkerEmitter, getIntegrationSyncWorkerEmitter } from '../serverless/utils/serviceSQS'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import TenantRepository from '../database/repositories/tenantRepository'
import MemberService from './memberService'
import OrganizationService from './organizationService'

const discordToken = DISCORD_CONFIG.token2 || DISCORD_CONFIG.token

export default class IntegrationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async createOrUpdate(data, transaction?: any) {
    try {
      const record = await IntegrationRepository.findByPlatform(data.platform, {
        ...this.options,
        transaction,
      })
      const updatedRecord = await this.update(record.id, data, transaction)
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
        const record = await this.create(data, transaction)
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
          telemetryTrack(
            'Integration created',
            {
              id: record.id,
              createdAt: record.createdAt,
              platform: record.platform,
            },
            this.options,
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

  async findAllByPlatform(platform) {
    return IntegrationRepository.findAllByPlatform(platform, this.options)
  }

  async create(data, transaction?: any) {
    try {
      const record = await IntegrationRepository.create(data, {
        ...this.options,
        transaction,
      })

      return record
    } catch (error) {
      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'integration')
      throw error
    }
  }

  async update(id, data, transaction?: any) {
    try {
      const record = await IntegrationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      return record
    } catch (err) {
      SequelizeRepository.handleUniqueFieldError(err, this.options.language, 'integration')

      throw err
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
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
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

      const result = this.create(dataToCreate, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      return await result
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw err
    }
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
      privateKey = Buffer.from(privateKey, 'base64').toString('ascii')
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
   * Adds GitHub integration to a tenant and calls the onboarding SOA endpoint
   * @param code Temporary code generated by GitHub after authorize
   * @param installId Install id of the Crowd GitHub app
   * @param setupAction
   * @returns integration object
   */
  async connectGithub(code, installId, setupAction = 'install') {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    let integration
    let run
    try {
      if (setupAction === 'request') {
        return await this.createOrUpdate(
          {
            platform: PlatformType.GITHUB,
            status: 'waiting-approval',
          },
          transaction,
        )
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

      // TODO: I will do this later. For now they can add it manually.
      // // If the git integration is configured, we add the repos to the git config
      // let isGitintegrationConfigured
      // try {
      //   await this.findByPlatform(PlatformType.GIT)
      //   isGitintegrationConfigured = true
      // } catch (err) {
      //   isGitintegrationConfigured = false
      // }
      // if (isGitintegrationConfigured) {
      //   const gitRemotes = await this.gitGetRemotes()
      //   await this.gitConnectOrUpdate({
      //     remotes: [...gitRemotes, ...repos.map((repo) => repo.cloneUrl)],
      //   })
      // }

      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GITHUB,
          token,
          settings: { repos, updateMemberAttributes: true },
          integrationIdentifier: installId,
          status: 'in-progress',
        },
        transaction,
      )

      run = await new IntegrationRunRepository({ ...this.options, transaction }).create({
        integrationId: integration.id,
        tenantId: integration.tenantId,
        onboarding: true,
        state: IntegrationRunState.PENDING,
      })

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    await sendNodeWorkerMessage(
      integration.tenantId,
      new NodeWorkerIntegrationProcessMessage(run.id),
    )

    return integration
  }

  /**
   * Adds discord integration to a tenant
   * @param guildId Guild id of the discord server
   * @returns integration object
   */
  async discordConnect(guildId) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    let integration

    try {
      this.options.log.info('Creating Discord integration!')
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.DISCORD,
          integrationIdentifier: guildId,
          token: discordToken,
          settings: { channels: [], updateMemberAttributes: true },
          status: 'in-progress',
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending Discord message to int-run-worker!',
    )
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      true,
    )

    return integration
  }

  async linkedinOnboard(organizationId) {
    let integration
    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.LINKEDIN, {
        ...this.options,
      })
    } catch (err) {
      this.options.log.error(err, 'Error while fetching LinkedIn integration from DB!')
      throw new Error404()
    }

    let valid = false
    for (const org of integration.settings.organizations) {
      if (org.id === organizationId) {
        org.inUse = true
        valid = true
        break
      }
    }

    if (!valid) {
      this.options.log.error(`No organization with id ${organizationId} found!`)
      throw new Error404(this.options.language, 'errors.linkedin.noOrganizationFound')
    }

    if (integration.status === 'pending-action') {
      const transaction = await SequelizeRepository.createTransaction(this.options)

      try {
        integration = await this.createOrUpdate(
          {
            platform: PlatformType.LINKEDIN,
            status: 'in-progress',
            settings: integration.settings,
          },
          transaction,
        )

        await SequelizeRepository.commitTransaction(transaction)
      } catch (err) {
        await SequelizeRepository.rollbackTransaction(transaction)
        throw err
      }

      const emitter = await getIntegrationRunWorkerEmitter()
      await emitter.triggerIntegrationRun(
        integration.tenantId,
        integration.platform,
        integration.id,
        true,
      )

      return integration
    }

    this.options.log.error('LinkedIn integration is not in pending-action status!')
    throw new Error404(this.options.language, 'errors.linkedin.cantOnboardWrongStatus')
  }

  async hubspotStopSyncMember(payload: IHubspotManualSyncPayload) {
    if (!payload.memberId){
      throw new Error('memberId is required in the payload while syncing member to hubspot!')
    }

    // update member.attributes.syncRemote.hubspot to false
    const memberService = new MemberService(this.options)

    const member = await memberService.findById(payload.memberId)

    if (!member.attributes.syncRemote) {
      member.attributes.syncRemote = {
        default: false,
        [PlatformType.HUBSPOT]: false
      }
    }
    else{
      member.attributes.syncRemote[PlatformType.HUBSPOT] = false
      member.attributes.syncRemote.default = false
    }

    await memberService.update(payload.memberId, {attributes: member.attributes})

  }
  
  
  async hubspotSyncMember(payload: IHubspotManualSyncPayload) {
    if (!payload.memberId){
      throw new Error('memberId is required in the payload while syncing member to hubspot!')
    }

    let integration

    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
        ...this.options,
      })
    } catch (err) {
      this.options.log.error(err, 'Error while fetching HubSpot integration from DB!')
      throw new Error404()
    }
    // update member.attributes.syncRemote.hubspot to true
    const memberService = new MemberService(this.options)

    const member = await memberService.findById(payload.memberId)

    if (!member.attributes.syncRemote) {
      member.attributes.syncRemote = {
        default: true,
        [PlatformType.HUBSPOT]: true
      }
    }
    else{
      member.attributes.syncRemote[PlatformType.HUBSPOT] = true
      member.attributes.syncRemote.default = true
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    // set integration.settings.syncRemoteEnabled to true, and mark member as syncRemote
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            ...integration.settings,
            syncRemoteEnabled: true
          },
        },
        transaction,
      )
      await memberService.update(payload.memberId, {attributes: member.attributes})

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    const integrationSyncWorkerEmitter = await getIntegrationSyncWorkerEmitter()
    await integrationSyncWorkerEmitter.triggerSyncMember(this.options.currentTenant.id, integration.id, payload.memberId)

  }


  async hubspotStopSyncOrganization(payload: IHubspotManualSyncPayload) {
    if (!payload.organizationId){
      throw new Error('organizationId is required in the payload while stopping organization sync to hubspot!')
    }

    // update organization.attributes.syncRemote.hubspot to false
    const organizationService = new OrganizationService(this.options)

    const organization = await organizationService.findById(payload.organizationId)

    if (!organization.attributes.syncRemote) {
      organization.attributes.syncRemote = {
        default: false,
        [PlatformType.HUBSPOT]: false
      }
    }
    else{
      organization.attributes.syncRemote[PlatformType.HUBSPOT] = false
      organization.attributes.syncRemote.default = false
    }

    await organizationService.update(payload.organizationId, {attributes: organization.attributes})

  }

  async hubspotSyncOrganization(payload: IHubspotManualSyncPayload) {
    if (!payload.organizationId){
      throw new Error('organizationId is required in the payload while syncing organization to hubspot!')
    }

    let integration

    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
        ...this.options,
      })
    } catch (err) {
      this.options.log.error(err, 'Error while fetching HubSpot integration from DB!')
      throw new Error404()
    }
    // update organization.attributes.syncRemote.hubspot to true
    const organizationService = new OrganizationService(this.options)

    const organization = await organizationService.findById(payload.organizationId)

    if(!organization.attributes){
      organization.attributes = {
        syncRemote: {
          default: true,
          [PlatformType.HUBSPOT]: true
        }
      }
    }
    else if (!organization.attributes.syncRemote) {
      organization.attributes.syncRemote = {
        default: true,
        [PlatformType.HUBSPOT]: true
      }
    }
    else{
      organization.attributes.syncRemote[PlatformType.HUBSPOT] = true
      organization.attributes.syncRemote.default = true
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    // set integration.settings.syncRemoteEnabled to true, and mark organization as syncRemote
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            ...integration.settings,
            syncRemoteEnabled: true
          },
        },
        transaction,
      )
      await organizationService.update(payload.organizationId, {attributes: organization.attributes})

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    const integrationSyncWorkerEmitter = await getIntegrationSyncWorkerEmitter()
    await integrationSyncWorkerEmitter.triggerSyncOrganization(this.options.currentTenant.id, integration.id, payload.organizationId)

  }

  async hubspotOnboard(onboardSettings: IHubspotOnboardingSettings) {
    if (onboardSettings.enabledFor.length === 0) {
      throw new Error400(this.options.language, 'errors.hubspot.missingEnabledEntities')
    }

    if (
      !onboardSettings.attributesMapping.members &&
      !onboardSettings.attributesMapping.organizations
    ) {
      throw new Error400(this.options.language, 'errors.hubspot.missingAttributesMapping')
    }

    if (
      onboardSettings.enabledFor.includes(HubspotEntity.MEMBERS) &&
      !onboardSettings.attributesMapping.members
    ) {
      throw new Error400(this.options.language, 'errors.hubspot.missingAttributesMapping')
    }

    if (
      onboardSettings.enabledFor.includes(HubspotEntity.ORGANIZATIONS) &&
      !onboardSettings.attributesMapping.organizations
    ) {
      throw new Error400(this.options.language, 'errors.hubspot.missingAttributesMapping')
    }

    const tenantId = this.options.currentTenant.id

    let integration

    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
        ...this.options,
      })
    } catch (err) {
      this.options.log.error(err, 'Error while fetching HubSpot integration from DB!')
      throw new Error404()
    }

    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows

    const identities = await TenantRepository.getAvailablePlatforms(tenantId, this.options)

    const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.MEMBERS,
      memberAttributeSettings,
      identities,
    )
    const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(HubspotEntity.ORGANIZATIONS)

    // validate members
    if (onboardSettings.attributesMapping.members) {
      for (const field of Object.keys(onboardSettings.attributesMapping.members)) {
        const hubspotProperty: IHubspotProperty =
          integration.settings.hubspotProperties.members.find(
            (p) => p.name === onboardSettings.attributesMapping.members[field],
          )
        if (!memberMapper.isFieldMappableToHubspotType(field, hubspotProperty.type)) {
          throw new Error(
            `Member field ${field} has incompatible type with hubspot property ${hubspotProperty.name}`,
          )
        }
      }
    }

    // validate organizations
    if (onboardSettings.attributesMapping.organizations) {
      for (const field of Object.keys(onboardSettings.attributesMapping.organizations)) {
        const hubspotProperty: IHubspotProperty =
          integration.settings.hubspotProperties.organizations.find(
            (p) => p.name === onboardSettings.attributesMapping.organizations[field],
          )
        if (!organizationMapper.isFieldMappableToHubspotType(field, hubspotProperty.type)) {
          throw new Error(
            `Organization field ${field} has incompatible type with hubspot property ${hubspotProperty.name}`,
          )
        }
      }
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    // save attribute mapping and enabledFor
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            ...integration.settings,
            attributesMapping: onboardSettings.attributesMapping,
            enabledFor: onboardSettings.enabledFor,
          },
          status: 'in-progress',
        },
        transaction,
      )
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    // Send queue message that starts the hubspot integration
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      true,
    )
  }

  async hubspotGetMappableFields() {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows

    const identities = await TenantRepository.getAvailablePlatforms(
      this.options.currentTenant.id,
      this.options,
    )

    const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.MEMBERS,
      memberAttributeSettings,
      identities,
    )
    const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(HubspotEntity.ORGANIZATIONS)

    return {
      members: memberMapper.getFieldTypeMap(),
      organizations: organizationMapper.getFieldTypeMap(),
    }
  }

  async hubspotUpdateProperties(): Promise<IHubspotProperty[]> {
    const tenantId = this.options.currentTenant.id
    const nangoId = `${tenantId}-${PlatformType.HUBSPOT}`

    let integration

    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
        ...this.options,
      })
    } catch (err) {
      this.options.log.error(err, 'Error while fetching HubSpot integration from DB!')
      throw new Error404()
    }

    let token: string
    try {
      token = await getToken(nangoId, PlatformType.HUBSPOT, this.options.log)
    } catch (err) {
      this.options.log.error(err, 'Error while verifying HubSpot tenant token in Nango!')
      throw new Error400(this.options.language, 'errors.noNangoToken.message')
    }

    if (!token) {
      throw new Error400(this.options.language, 'errors.noNangoToken.message')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    const context = {
      log: this.options.log,
      serviceSettings: {
        nangoId,
        nangoUrl: NANGO_CONFIG.url,
        nangoSecretKey: NANGO_CONFIG.secretKey,
      },
    }

    const hubspotMemberProperties = await getHubspotProperties(
      nangoId,
      HubspotEndpoint.CONTACTS,
      context,
    )
    const hubspotOrganizationProperties = await getHubspotProperties(
      nangoId,
      HubspotEndpoint.COMPANIES,
      context,
    )

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            ...integration.settings,
            updateMemberAttributes: true,
            hubspotProperties: {
              [HubspotEntity.MEMBERS]: hubspotMemberProperties,
              [HubspotEntity.ORGANIZATIONS]: hubspotOrganizationProperties,
            },
          },
          status: 'in-progress',
        },
        transaction,
      )
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    return integration.settings.hubspotProperties
  }

  async hubspotConnect() {
    const tenantId = this.options.currentTenant.id
    const nangoId = `${tenantId}-${PlatformType.HUBSPOT}`

    let token: string
    try {
      token = await getToken(nangoId, PlatformType.HUBSPOT, this.options.log)
      this.options.log.info(`TOKEN IS: ${token}`)
    } catch (err) {
      this.options.log.error(err, 'Error while verifying HubSpot tenant token in Nango!')
      throw new Error400(this.options.language, 'errors.noNangoToken.message')
    }

    if (!token) {
      throw new Error400(this.options.language, 'errors.noNangoToken.message')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    const context = {
      log: this.options.log,
      serviceSettings: {
        nangoId,
        nangoUrl: NANGO_CONFIG.url,
        nangoSecretKey: NANGO_CONFIG.secretKey,
      },
    }

    const hubspotMemberProperties: IHubspotProperty[] = await getHubspotProperties(
      nangoId,
      HubspotEndpoint.CONTACTS,
      context,
    )

    const hubspotOrganizationProperties: IHubspotProperty[] = await getHubspotProperties(
      nangoId,
      HubspotEndpoint.COMPANIES,
      context,
    )

    const hubspotInfo: IHubspotTokenInfo = await getHubspotTokenInfo(nangoId, context)

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            updateMemberAttributes: true,
            hubspotProperties: {
              [HubspotEntity.MEMBERS]: hubspotMemberProperties,
              [HubspotEntity.ORGANIZATIONS]: hubspotOrganizationProperties,
            },
            hubspotId: hubspotInfo.hub_id,
          },
          status: 'pending-action',
        },
        transaction,
      )
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    return integration
  }

  async linkedinConnect() {
    const tenantId = this.options.currentTenant.id
    const nangoId = `${tenantId}-${PlatformType.LINKEDIN}`

    let token: string
    try {
      token = await getToken(nangoId, PlatformType.LINKEDIN, this.options.log)
    } catch (err) {
      this.options.log.error(err, 'Error while verifying LinkedIn tenant token in Nango!')
      throw new Error400(this.options.language, 'errors.noNangoToken.message')
    }

    if (!token) {
      throw new Error400(this.options.language, 'errors.noNangoToken.message')
    }

    // fetch organizations
    let organizations: ILinkedInOrganization[]
    try {
      organizations = await getOrganizations(nangoId, this.options.log)
    } catch (err) {
      this.options.log.error(err, 'Error while fetching LinkedIn organizations!')
      throw new Error400(this.options.language, 'errors.linkedin.noOrganization')
    }

    if (organizations.length === 0) {
      this.options.log.error('No organization found for LinkedIn integration!')
      throw new Error400(this.options.language, 'errors.linkedin.noOrganization')
    }

    let status = 'pending-action'
    if (organizations.length === 1) {
      status = 'in-progress'
      organizations[0].inUse = true
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.LINKEDIN,
          settings: { organizations, updateMemberAttributes: true },
          status,
        },
        transaction,
      )
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    if (status === 'in-progress') {
      const emitter = await getIntegrationRunWorkerEmitter()
      await emitter.triggerIntegrationRun(
        integration.tenantId,
        integration.platform,
        integration.id,
        true,
      )
    }

    return integration
  }

  /**
   * Creates the Reddit integration and starts the onboarding
   * @param subreddits Subreddits to track
   * @returns integration object
   */
  async redditOnboard(subreddits) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    let integration

    try {
      this.options.log.info('Creating reddit integration!')
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.REDDIT,
          settings: { subreddits, updateMemberAttributes: true },
          status: 'in-progress',
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending reddit message to int-run-worker!',
    )
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      true,
    )

    return integration
  }

  /**
   * Adds/updates Dev.to integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async devtoConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    try {
      this.options.log.info('Creating devto integration!')
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.DEVTO,
          settings: {
            users: integrationData.users,
            organizations: integrationData.organizations,
            articles: [],
            updateMemberAttributes: true,
          },
          status: 'in-progress',
        },
        transaction,
      )
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending devto message to int-run-worker!',
    )
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      true,
    )

    return integration
  }

  /**
   * Adds/updates Git integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async gitConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GIT,
          settings: {
            remotes: integrationData.remotes,
          },
          status: 'done',
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
    return integration
  }

  /**
   * Get all remotes for the Git integration, by segment
   * @returns Remotes for the Git integration
   */
  async gitGetRemotes() {
    try {
      const integrations = await this.findAllByPlatform(PlatformType.GIT)
      return integrations.reduce((acc, integration) => {
        const {
          segmentId,
          settings: { remotes },
        } = integration
        acc[segmentId] = remotes
        return acc
      }, {})
    } catch (err) {
      throw new Error400(this.options.language, 'errors.git.noIntegration')
    }
  }

  /**
   * Adds/updates Hacker News integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async hackerNewsConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HACKERNEWS,
          settings: {
            keywords: integrationData.keywords,
            urls: integrationData.urls,
            updateMemberAttributes: true,
          },
          status: 'in-progress',
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending HackerNews message to int-run-worker!',
    )
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      true,
    )

    return integration
  }

  /**
   * Adds/updates slack integration
   * @param integrationData to create the integration object
   * @returns integration object
   */
  async slackCallback(integrationData) {
    integrationData.settings = integrationData.settings || {}
    integrationData.settings.updateMemberAttributes = true

    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    try {
      this.options.log.info('Creating Slack integration!')
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.SLACK,
          ...integrationData,
          status: 'in-progress',
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending Slack message to int-run-worker!',
    )

    const isOnboarding: boolean = !('channels' in integration.settings)
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      isOnboarding,
    )

    return integration
  }

  /**
   * Adds/updates twitter integration
   * @param integrationData to create the integration object
   * @returns integration object
   */
  async twitterCallback(integrationData) {
    const { profileId, token, refreshToken } = integrationData
    const hashtags =
      !integrationData.hashtags || integrationData.hashtags === '' ? [] : integrationData.hashtags

    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration
    let run

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.TWITTER,
          integrationIdentifier: profileId,
          token,
          refreshToken,
          limitCount: 0,
          limitLastResetAt: moment().format('YYYY-MM-DD HH:mm:ss'),
          status: 'in-progress',
          settings: {
            followers: [],
            hashtags: typeof hashtags === 'string' ? hashtags.split(',') : hashtags,
            updateMemberAttributes: true,
          },
        },
        transaction,
      )

      run = await new IntegrationRunRepository({ ...this.options, transaction }).create({
        integrationId: integration.id,
        tenantId: integration.tenantId,
        onboarding: true,
        state: IntegrationRunState.PENDING,
      })
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    await sendNodeWorkerMessage(
      integration.tenantId,
      new NodeWorkerIntegrationProcessMessage(run.id),
    )

    return integration
  }

  /**
   * Adds/updates Stack Overflow integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async stackOverflowConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    try {
      this.options.log.info('Creating Stack Overflow integration!')
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.STACKOVERFLOW,
          settings: {
            tags: integrationData.tags,
            keywords: integrationData.keywords,
            updateMemberAttributes: true,
          },
          status: 'in-progress',
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending StackOverflow message to int-run-worker!',
    )
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.platform,
      integration.id,
      true,
    )

    return integration
  }

  /**
   * Adds/updates Discourse integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async discourseConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration
    let run

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.DISCOURSE,
          settings: {
            apiKey: integrationData.apiKey,
            apiUsername: integrationData.apiUsername,
            forumHostname: integrationData.forumHostname,
            webhookSecret: integrationData.webhookSecret,
            updateMemberAttributes: true,
          },
          status: 'in-progress',
        },
        transaction,
      )

      run = await new IntegrationRunRepository({ ...this.options, transaction }).create({
        integrationId: integration.id,
        tenantId: integration.tenantId,
        onboarding: true,
        state: IntegrationRunState.PENDING,
      })
      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    await sendNodeWorkerMessage(
      integration.tenantId,
      new NodeWorkerIntegrationProcessMessage(run.id),
    )

    return integration
  }
}
