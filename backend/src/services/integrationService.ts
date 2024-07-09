/* eslint-disable no-promise-executor-return */
import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import moment from 'moment'
import lodash from 'lodash'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { PlatformType, Edition } from '@crowd/types'
import { Error400, Error404, Error542, EDITION } from '@crowd/common'
import {
  getHubspotLists,
  getHubspotProperties,
  getHubspotTokenInfo,
  HubspotEndpoint,
  HubspotEntity,
  HubspotFieldMapperFactory,
  IHubspotManualSyncPayload,
  IHubspotOnboardingSettings,
  IHubspotProperty,
  IHubspotTokenInfo,
  IProcessStreamContext,
} from '@crowd/integrations'
import { RedisCache } from '@crowd/redis'
import { encryptData } from '../utils/crypto'
import { ILinkedInOrganization } from '../serverless/integrations/types/linkedinTypes'
import { DISCORD_CONFIG, GITHUB_CONFIG, IS_TEST_ENV, KUBE_MODE, NANGO_CONFIG } from '../conf/index'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import track from '../segment/track'
import { getInstalledRepositories } from '../serverless/integrations/usecases/github/rest/getInstalledRepositories'
import {
  getGitHubRemoteStats,
  GitHubStats,
} from '../serverless/integrations/usecases/github/rest/getRemoteStats'
import telemetryTrack from '../segment/telemetryTrack'
import getToken from '../serverless/integrations/usecases/nango/getToken'
import { getOrganizations } from '../serverless/integrations/usecases/linkedin/getOrganizations'
import {
  getIntegrationRunWorkerEmitter,
  getIntegrationSyncWorkerEmitter,
} from '../serverless/utils/serviceSQS'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import TenantRepository from '../database/repositories/tenantRepository'
import GithubReposRepository from '../database/repositories/githubReposRepository'
import MemberService from './memberService'
import OrganizationService from './organizationService'
import MemberSyncRemoteRepository from '@/database/repositories/memberSyncRemoteRepository'
import OrganizationSyncRemoteRepository from '@/database/repositories/organizationSyncRemoteRepository'
import MemberRepository from '@/database/repositories/memberRepository'
import {
  GroupsioGetToken,
  GroupsioIntegrationData,
  GroupsioVerifyGroup,
} from '@/serverless/integrations/usecases/groupsio/types'
import SearchSyncService from './searchSyncService'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import IntegrationProgressRepository from '@/database/repositories/integrationProgressRepository'
import { IntegrationProgress } from '@/serverless/integrations/types/regularTypes'
import { findMemberById, MemberField } from '@crowd/data-access-layer/src/members'

const discordToken = DISCORD_CONFIG.token || DISCORD_CONFIG.token2

export default class IntegrationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async createOrUpdate(data, transaction?: any, options?: IRepositoryOptions) {
    try {
      const record = await IntegrationRepository.findByPlatform(data.platform, {
        ...(options || this.options),
        transaction,
      })

      const updatedRecord = await this.update(record.id, data, transaction, options)
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
        const record = await this.create(data, transaction, options)
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

  async create(data, transaction?: any, options?: IRepositoryOptions) {
    try {
      const record = await IntegrationRepository.create(data, {
        ...(options || this.options),
        transaction,
      })

      return record
    } catch (error) {
      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'integration')
      throw error
    }
  }

  async update(id, data, transaction?: any, options?: IRepositoryOptions) {
    try {
      const record = await IntegrationRepository.update(id, data, {
        ...(options || this.options),
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
      if (EDITION === Edition.LFX) {
        for (const id of ids) {
          let integration
          try {
            integration = await this.findById(id)
          } catch (err) {
            throw new Error404()
          }
          // remove github remotes from git integration
          if (integration.platform === PlatformType.GITHUB) {
            let shouldUpdateGit: boolean
            const mapping = await this.getGithubRepos(id)
            const repos: Record<string, string[]> = mapping.reduce((acc, { url, segment }) => {
              if (!acc[segment.id]) {
                acc[segment.id] = []
              }
              acc[segment.id].push(url)
              return acc
            }, {})

            for (const [segmentId, urls] of Object.entries(repos)) {
              const segmentOptions: IRepositoryOptions = {
                ...this.options,
                currentSegments: [
                  {
                    ...this.options.currentSegments[0],
                    id: segmentId as string,
                  },
                ],
              }

              try {
                await IntegrationRepository.findByPlatform(PlatformType.GIT, segmentOptions)
                shouldUpdateGit = true
              } catch (err) {
                shouldUpdateGit = false
              }

              if (shouldUpdateGit) {
                const gitInfo = await this.gitGetRemotes(segmentOptions)
                const gitRemotes = gitInfo[segmentId].remotes
                await this.gitConnectOrUpdate(
                  {
                    remotes: gitRemotes.filter((remote) => !urls.includes(remote)),
                  },
                  segmentOptions,
                )
              }
            }
          }

          await IntegrationRepository.destroy(id, {
            ...this.options,
            transaction,
          })
        }
      } else {
        for (const id of ids) {
          await IntegrationRepository.destroy(id, {
            ...this.options,
            transaction,
          })
        }
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
      const githubOwner = IntegrationService.extractOwner(repos, this.options)

      let orgAvatar
      try {
        const response = await request('GET /users/{user}', {
          user: githubOwner,
        })
        orgAvatar = response.data.avatar_url
      } catch (err) {
        this.options.log.warn(err, 'Error while fetching GitHub user!')
      }

      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GITHUB,
          token,
          settings: { repos, updateMemberAttributes: true, orgAvatar },
          integrationIdentifier: installId,
          status: 'mapping',
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

  static extractOwner(repos, options) {
    const owners = lodash.countBy(repos, 'owner')

    if (Object.keys(owners).length === 1) {
      return Object.keys(owners)[0]
    }

    options.log.warn('Multiple owners found in GitHub repos!', owners)

    // return the owner with the most repos
    return lodash.maxBy(Object.keys(owners), (owner) => owners[owner])
  }

  async mapGithubRepos(integrationId, mapping) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    const txOptions = {
      ...this.options,
      transaction,
    }

    try {
      await GithubReposRepository.updateMapping(integrationId, mapping, txOptions)

      // add the repos to the git integration
      if (EDITION === Edition.LFX) {
        const repos: Record<string, string[]> = Object.entries(mapping).reduce(
          (acc, [url, segmentId]) => {
            if (!acc[segmentId as string]) {
              acc[segmentId as string] = []
            }
            acc[segmentId as string].push(url)
            return acc
          },
          {},
        )

        for (const [segmentId, urls] of Object.entries(repos)) {
          let isGitintegrationConfigured
          const segmentOptions: IRepositoryOptions = {
            ...this.options,
            currentSegments: [
              {
                ...this.options.currentSegments[0],
                id: segmentId as string,
              },
            ],
          }
          try {
            await IntegrationRepository.findByPlatform(PlatformType.GIT, segmentOptions)

            isGitintegrationConfigured = true
          } catch (err) {
            isGitintegrationConfigured = false
          }

          if (isGitintegrationConfigured) {
            const gitInfo = await this.gitGetRemotes(segmentOptions)
            const gitRemotes = gitInfo[segmentId as string].remotes
            await this.gitConnectOrUpdate(
              {
                remotes: Array.from(new Set([...gitRemotes, ...urls])),
              },
              segmentOptions,
            )
          } else {
            await this.gitConnectOrUpdate(
              {
                remotes: urls,
              },
              segmentOptions,
            )
          }
        }
      }

      const integration = await IntegrationRepository.update(
        integrationId,
        { status: 'in-progress' },
        txOptions,
      )

      this.options.log.info(
        { tenantId: integration.tenantId },
        'Sending GitHub message to int-run-worker!',
      )
      const emitter = await getIntegrationRunWorkerEmitter()
      await emitter.triggerIntegrationRun(
        integration.tenantId,
        integration.platform,
        integration.id,
        true,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
  }

  async getGithubRepos(integrationId): Promise<any[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    const txOptions = {
      ...this.options,
      transaction,
    }

    try {
      const mapping = await GithubReposRepository.getMapping(integrationId, txOptions)

      await SequelizeRepository.commitTransaction(transaction)
      return mapping
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
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
    if (!payload.memberId) {
      throw new Error('memberId is required in the payload while syncing member to hubspot!')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const qx = SequelizeRepository.getQueryExecutor(this.options, transaction)
      const member = await findMemberById(qx, payload.memberId, [MemberField.ID])

      const memberSyncRemoteRepository = new MemberSyncRemoteRepository({
        ...this.options,
        transaction,
      })
      await memberSyncRemoteRepository.stopMemberManualSync(member.id)

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      this.options.log.error(err, 'Error while stopping hubspot member sync!')
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
  }

  async hubspotSyncMember(payload: IHubspotManualSyncPayload) {
    if (!payload.memberId) {
      throw new Error('memberId is required in the payload while syncing member to hubspot!')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    let integration
    let member: { id: string }
    let memberSyncRemote

    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
        ...this.options,
        transaction,
      })

      const qx = SequelizeRepository.getQueryExecutor(this.options, transaction)
      member = await findMemberById(qx, payload.memberId, [MemberField.ID])

      const memberSyncRemoteRepo = new MemberSyncRemoteRepository({ ...this.options, transaction })

      memberSyncRemote = await memberSyncRemoteRepo.markMemberForSyncing({
        integrationId: integration.id,
        memberId: member.id,
        metaData: null,
        syncFrom: 'manual',
        lastSyncedAt: null,
      })

      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            ...integration.settings,
            syncRemoteEnabled: true,
          },
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      this.options.log.error(err, 'Error while starting Hubspot member sync!')
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    const integrationSyncWorkerEmitter = await getIntegrationSyncWorkerEmitter()
    await integrationSyncWorkerEmitter.triggerSyncMember(
      this.options.currentTenant.id,
      integration.id,
      payload.memberId,
      memberSyncRemote.id,
    )

    const searchSyncService = new SearchSyncService(this.options)

    // send it to opensearch because in member.update we bypass while passing transactions
    await searchSyncService.triggerMemberSync(this.options.currentTenant.id, member.id)
  }

  async hubspotStopSyncOrganization(payload: IHubspotManualSyncPayload) {
    if (!payload.organizationId) {
      throw new Error(
        'organizationId is required in the payload while stopping organization sync to hubspot!',
      )
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const organizationService = new OrganizationService(this.options)

      const organization = await organizationService.findById(payload.organizationId)

      const organizationSyncRemoteRepository = new OrganizationSyncRemoteRepository({
        ...this.options,
        transaction,
      })
      await organizationSyncRemoteRepository.stopOrganizationManualSync(organization.id)
    } catch (err) {
      this.options.log.error(err, 'Error while stopping Hubspot organization sync!')
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
  }

  async hubspotSyncOrganization(payload: IHubspotManualSyncPayload) {
    if (!payload.organizationId) {
      throw new Error(
        'organizationId is required in the payload while syncing organization to hubspot!',
      )
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    let integration
    let organization
    let organizationSyncRemote

    try {
      integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
        ...this.options,
        transaction,
      })

      const organizationService = new OrganizationService(this.options)

      organization = await organizationService.findById(payload.organizationId)

      const organizationSyncRemoteRepo = new OrganizationSyncRemoteRepository({
        ...this.options,
        transaction,
      })

      organizationSyncRemote = await organizationSyncRemoteRepo.markOrganizationForSyncing({
        integrationId: integration.id,
        organizationId: organization.id,
        metaData: null,
        syncFrom: 'manual',
        lastSyncedAt: null,
      })

      integration = await this.createOrUpdate(
        {
          platform: PlatformType.HUBSPOT,
          settings: {
            ...integration.settings,
            syncRemoteEnabled: true,
          },
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      const integrationSyncWorkerEmitter = await getIntegrationSyncWorkerEmitter()
      await integrationSyncWorkerEmitter.triggerSyncOrganization(
        this.options.currentTenant.id,
        integration.id,
        payload.organizationId,
        organizationSyncRemote.id,
      )
    } catch (err) {
      this.options.log.error(err, 'Error while starting Hubspot organization sync!')
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
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

    const platforms = (await TenantRepository.getAvailablePlatforms(tenantId, this.options)).map(
      (p) => p.platform,
    )

    const hubspotId = integration.settings.hubspotId

    const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.MEMBERS,
      hubspotId,
      memberAttributeSettings,
      platforms,
    )
    const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.ORGANIZATIONS,
      hubspotId,
    )

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
            crowdAttributes: memberAttributeSettings,
            platforms,
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

  async hubspotGetLists() {
    const tenantId = this.options.currentTenant.id
    const nangoId = `${tenantId}-${PlatformType.HUBSPOT}`

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

    const context = {
      log: this.options.log,
      serviceSettings: {
        nangoId,
        nangoUrl: NANGO_CONFIG.url,
        nangoSecretKey: NANGO_CONFIG.secretKey,
      },
    } as IProcessStreamContext

    const memberLists = await getHubspotLists(nangoId, context)

    return {
      members: memberLists,
      organizations: [], // hubspot doesn't support company lists yet
    }
  }

  async hubspotGetMappableFields() {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows

    const identities = await TenantRepository.getAvailablePlatforms(
      this.options.currentTenant.id,
      this.options,
    )

    // hubspotId is not used while getting the typemap, we can send it null
    const memberMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.MEMBERS,
      null,
      memberAttributeSettings,
      identities.map((i) => i.platform),
    )
    const organizationMapper = HubspotFieldMapperFactory.getFieldMapper(
      HubspotEntity.ORGANIZATIONS,
      null,
    )

    return {
      members: memberMapper.getTypeMap(),
      organizations: organizationMapper.getTypeMap(),
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
    } as IProcessStreamContext

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
    } as IProcessStreamContext

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
          token: integrationData.apiKey,
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
  async gitConnectOrUpdate(integrationData, options?: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options || this.options)
    let integration
    const stripGit = (url: string) => {
      if (url.endsWith('.git')) {
        return url.slice(0, -4)
      }
      return url
    }
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GIT,
          settings: {
            remotes: integrationData.remotes.map((remote) => stripGit(remote)),
          },
          status: 'done',
        },
        transaction,
        options,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
    return integration
  }

  /**
   * Adds/updates Confluence integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async confluenceConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.CONFLUENCE,
          settings: integrationData.settings,
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
   * Adds/updates Gerrit integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async gerritConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    try {
      const res = await IntegrationService.getGerritServerRepos(integrationData.remote.orgURL)
      if (integrationData.remote.enableAllRepos) {
        integrationData.remote.repoNames = res.repoNames
      }
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GERRIT,
          settings: {
            remote: integrationData.remote,
          },
          status: 'done',
        },
        transaction,
      )

      if (integrationData.remote.enableGit) {
        const stripGit = (url: string) => {
          if (url.endsWith('.git')) {
            return url.slice(0, -4)
          }
          return url
        }

        integration = await this.createOrUpdate(
          {
            platform: PlatformType.GIT,
            settings: {
              remotes: integrationData.remote.repoNames.map((repo) =>
                stripGit(`${integrationData.remote.orgURL}${res.urlPartial}/${repo}`),
              ),
            },
            status: 'done',
          },
          transaction,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
    return integration
  }

  static async getGerritServerRepos(
    serverURL: string,
  ): Promise<{ repoNames: string[]; urlPartial: string }> {
    const urlPartials = ['/r', '/gerrit', '/']
    for (const p of urlPartials) {
      try {
        const result = await axios.get(`${serverURL}${p}/projects/?`, {})
        const str = result.data.replace(")]}'\n", '')
        const data = JSON.parse(str)

        const repos = Object.keys(data).filter(
          (key) => key !== '.github' && key !== 'All-Projects' && key !== 'All-Users',
        )
        return {
          repoNames: repos,
          urlPartial: p,
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          throw new Error404('Error in getGerritServerRepos:', error)
        }
      }
    }
    return { repoNames: [], urlPartial: '' }
  }

  /**
   * Get all remotes for the Git integration, by segment
   * @returns Remotes for the Git integration
   */
  async gitGetRemotes(options?: IRepositoryOptions): Promise<{
    [segmentId: string]: { remotes: string[]; integrationId: string }
  }> {
    try {
      const integrations = await IntegrationRepository.findAllByPlatform(
        PlatformType.GIT,
        options || this.options,
      )
      return integrations.reduce((acc, integration) => {
        const {
          id,
          segmentId,
          settings: { remotes },
        } = integration
        acc[segmentId] = { remotes, integrationId: id }
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

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending Twitter message to int-run-worker!',
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

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }

    this.options.log.info(
      { tenantId: integration.tenantId },
      'Sending Discourse message to int-run-worker!',
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

  async groupsioConnectOrUpdate(integrationData: GroupsioIntegrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    // integration data should have the following fields
    // email, token, array of groups
    // we shouldn't store password and 2FA token in the database
    // user should update them every time thety change something

    try {
      for (const group of integrationData.groups) {
        const config: AxiosRequestConfig = {
          method: 'get',
          url: `https://groups.io/api/v1/getgroup?group_name=${encodeURIComponent(group.slug)}`,
          headers: {
            'Content-Type': 'application/json',
            Cookie: integrationData.token,
          },
        }

        const response = await axios(config)
        group.id = response.data.id
        group.name = response.data.nice_group_name
      }
      this.options.log.info('Creating Groups.io integration!')
      const encryptedPassword = encryptData(integrationData.password)
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GROUPSIO,
          settings: {
            email: integrationData.email,
            token: integrationData.token,
            tokenExpiry: integrationData.tokenExpiry,
            password: encryptedPassword,
            groups: integrationData.groups,
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
      'Sending Groups.io message to int-run-worker!',
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

  async groupsioGetToken(data: GroupsioGetToken) {
    const config: AxiosRequestConfig = {
      method: 'post',
      url: 'https://groups.io/api/v1/login',
      params: {
        email: data.email,
        password: data.password,
        twofactor: data.twoFactorCode,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    }

    let response: AxiosResponse

    try {
      response = await axios(config)

      // we need to get cookie from the response

      const cookie = response.headers['set-cookie'][0].split(';')[0]
      const cookieExpiryString: string = response.headers['set-cookie'][0]
        .split(';')[3]
        .split('=')[1]
      const cookieExpiry = moment(cookieExpiryString).format('YYYY-MM-DD HH:mm:ss.sss Z')

      return {
        groupsioCookie: cookie,
        groupsioCookieExpiry: cookieExpiry,
      }
    } catch (err) {
      if ('two_factor_required' in response.data) {
        throw new Error400(this.options.language, 'errors.groupsio.twoFactorRequired')
      }
      throw new Error400(this.options.language, 'errors.groupsio.invalidCredentials')
    }
  }

  async groupsioVerifyGroup(data: GroupsioVerifyGroup) {
    const groupName = data.groupName

    const config: AxiosRequestConfig = {
      method: 'post',
      url: `https://groups.io/api/v1/gettopics?group_name=${encodeURIComponent(groupName)}`,
      headers: {
        'Content-Type': 'application/json',
        Cookie: data.cookie,
      },
    }

    let response: AxiosResponse

    try {
      response = await axios(config)

      return {
        group: response?.data?.data?.group_id,
      }
    } catch (err) {
      throw new Error400(this.options.language, 'errors.groupsio.invalidGroup')
    }
  }

  /**
   * Adds/updates Jira integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async jiraConnectOrUpdate(integrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.JIRA,
          settings: {
            url: integrationData.url,
            auth: {
              username: integrationData.username,
              personalAccessToken: integrationData.personalAccessToken,
              apiToken: integrationData.apiToken,
            },
            projects: integrationData.projects.map((project) => project.toUpperCase()),
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

  async getIntegrationProgress(integrationId: string): Promise<IntegrationProgress> {
    const integration = await this.findById(integrationId)
    const segments = SequelizeRepository.getCurrentSegments(this.options)

    // special case for github
    if (integration.platform === PlatformType.GITHUB) {
      if (integration.status !== 'in-progress') {
        return {
          type: 'github',
          segmentId: integration.segmentId,
          segmentName: segments.find((s) => s.id === integration.segmentId)?.name,
          platform: integration.platform,
          reportStatus: 'integration-is-not-in-progress',
        }
      }

      const githubToken = await IntegrationService.getInstallToken(
        integration.integrationIdentifier,
      )

      const repos = await getInstalledRepositories(githubToken)
      const cacheRemote = new RedisCache(
        'github-progress-remote',
        this.options.redis,
        this.options.log,
      )
      const cacheDb = new RedisCache('github-progress-db', this.options.redis, this.options.log)

      const getRemoteCachedStats = async (key: string) => {
        let cachedStats
        cachedStats = await cacheRemote.get(key)
        if (!cachedStats) {
          cachedStats = await getGitHubRemoteStats(githubToken, repos)
          // cache for 2 hours
          await cacheRemote.set(key, JSON.stringify(cachedStats), 2 * 60 * 60)
        } else {
          cachedStats = JSON.parse(cachedStats)
        }
        return cachedStats as GitHubStats
      }

      const getRemoteStatsOrExitEarly = async (
        key: string,
        maxSeconds = 1,
      ): Promise<GitHubStats | undefined> => {
        const result = await Promise.race([
          getRemoteCachedStats(key),
          new Promise((resolve) => setTimeout(() => resolve(-1), maxSeconds * 1000)),
        ])

        if (result === -1) {
          return undefined
        }
        return result as GitHubStats
      }

      const getDbCachedStats = async (key: string) => {
        let cachedStats
        cachedStats = await cacheDb.get(key)
        if (!cachedStats) {
          cachedStats = await IntegrationProgressRepository.getDbStatsForGithub(
            integration.tenantId,
            repos,
            this.options,
          )
          // cache for 1 minute
          await cacheDb.set(key, JSON.stringify(cachedStats), 60)
        } else {
          cachedStats = JSON.parse(cachedStats)
        }
        return cachedStats as GitHubStats
      }

      const getDbStatsOrExitEarly = async (
        key: string,
        maxSeconds = 1,
      ): Promise<GitHubStats | undefined> => {
        const result = await Promise.race([
          getDbCachedStats(key),
          new Promise((resolve) => setTimeout(() => resolve(-1), maxSeconds * 1000)),
        ])

        if (result === -1) {
          return undefined
        }

        return result as GitHubStats
      }

      const [remoteStats, dbStats] = await Promise.all([
        getRemoteStatsOrExitEarly(integrationId),
        getDbStatsOrExitEarly(integrationId),
      ])

      // this to prevent too long waiting time
      if (remoteStats === undefined || dbStats === undefined) {
        return {
          type: 'github',
          segmentId: integration.segmentId,
          segmentName: segments.find((s) => s.id === integration.segmentId)?.name,
          platform: integration.platform,
          reportStatus: 'calculating',
        }
      }

      const normailzeStats = (db: number, remote: number) => {
        if (remote === 0) return 100
        return Math.max(Math.min(Math.round((db / remote) * 100), 100), 0)
      }

      const calculateStatus = (db: number, remote: number) => {
        if (remote === 0) return 'ok'
        if (db >= remote) return 'ok'
        if (Math.abs(db - remote) / remote <= 0.02) return 'ok'
        return 'in-progress'
      }

      const calculateMessage = (db: number, remote: number, entity: string) => {
        if (remote === 0) return `0 ${entity} synced`
        if (db >= remote) return `${remote.toLocaleString()} ${entity} synced`
        if (Math.abs(db - remote) / remote <= 0.02) return `${db.toLocaleString()} ${entity} synced`
        return `${db.toLocaleString()} out of ${remote.toLocaleString()} ${entity} synced`
      }

      const remainingStreamsCount = await IntegrationProgressRepository.getPendingStreamsCount(
        integrationId,
        this.options,
      )

      const progress: IntegrationProgress = {
        type: 'github',
        segmentId: integration.segmentId,
        segmentName: segments.find((s) => s.id === integration.segmentId)?.name,
        platform: integration.platform,
        reportStatus: 'ok',
        data: {
          forks: {
            db: dbStats.forks,
            remote: remoteStats.forks,
            status: calculateStatus(dbStats.forks, remoteStats.forks),
            message: calculateMessage(dbStats.forks, remoteStats.forks, 'forks'),
            percentage: normailzeStats(dbStats.forks, remoteStats.forks),
          },
          pullRequests: {
            db: dbStats.totalPRs,
            remote: remoteStats.totalPRs,
            status: calculateStatus(dbStats.totalPRs, remoteStats.totalPRs),
            message: calculateMessage(dbStats.totalPRs, remoteStats.totalPRs, 'pull requests'),
            percentage: normailzeStats(dbStats.totalPRs, remoteStats.totalPRs),
          },
          issues: {
            db: dbStats.totalIssues,
            remote: remoteStats.totalIssues,
            status: calculateStatus(dbStats.totalIssues, remoteStats.totalIssues),
            message: calculateMessage(dbStats.totalIssues, remoteStats.totalIssues, 'issues'),
            percentage: normailzeStats(dbStats.totalIssues, remoteStats.totalIssues),
          },
          stars: {
            db: dbStats.stars,
            remote: remoteStats.stars,
            status: calculateStatus(dbStats.stars, remoteStats.stars),
            message: calculateMessage(dbStats.stars, remoteStats.stars, 'stars'),
            percentage: normailzeStats(dbStats.stars, remoteStats.stars),
          },
          other: {
            db: remainingStreamsCount,
            status: remainingStreamsCount > 0 ? 'in-progress' : 'ok',
            message:
              remainingStreamsCount > 0
                ? `${remainingStreamsCount} data streams are being processed...`
                : 'All data streams are processed',
          },
        },
      }

      return progress
    }

    if (integration.status !== 'in-progress') {
      return {
        type: 'github',
        segmentId: integration.segmentId,
        segmentName: segments.find((s) => s.id === integration.segmentId)?.name,
        platform: integration.platform,
        reportStatus: 'integration-is-not-in-progress',
      }
    }

    const remainingStreamsCount = await IntegrationProgressRepository.getPendingStreamsCount(
      integrationId,
      this.options,
    )
    const progress: IntegrationProgress = {
      type: 'other',
      platform: integration.platform,
      reportStatus: 'ok',
      segmentId: integration.segmentId,
      segmentName: segments.find((s) => s.id === integration.segmentId)?.name,
      data: {
        other: {
          db: remainingStreamsCount,
          status: remainingStreamsCount > 0 ? 'in-progress' : 'ok',
          message:
            remainingStreamsCount > 0
              ? `${remainingStreamsCount} data streams are being processed...`
              : 'All data streams are processed',
        },
      },
    }

    return progress
  }

  async getIntegrationProgressList(): Promise<IntegrationProgress[]> {
    const currentTenant = SequelizeRepository.getCurrentTenant(this.options)
    const currentSegments = SequelizeRepository.getCurrentSegments(this.options)

    if (currentSegments.length === 1) {
      const integrationIds =
        await IntegrationProgressRepository.getAllIntegrationsInProgressForSegment(
          currentTenant.id,
          this.options,
        )
      return Promise.all(integrationIds.map((id) => this.getIntegrationProgress(id)))
    }
    const integrationIds =
      await IntegrationProgressRepository.getAllIntegrationsInProgressForMultipleSegments(
        currentTenant.id,
        this.options,
      )
    return Promise.all(integrationIds.map((id) => this.getIntegrationProgress(id)))
  }
}
