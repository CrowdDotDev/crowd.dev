/* eslint-disable no-promise-executor-return */
import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import lodash from 'lodash'
import moment from 'moment'
import { Transaction } from 'sequelize'

import { EDITION, Error400, Error404, Error542, encryptData } from '@crowd/common'
import { CommonIntegrationService, getGithubInstallationToken } from '@crowd/common_services'
import { syncRepositoriesToGitV2 } from '@crowd/data-access-layer'
import {
  ICreateInsightsProject,
  deleteMissingSegmentRepositories,
  deleteSegmentRepositories,
  upsertSegmentRepositories,
} from '@crowd/data-access-layer/src/collections'
import {
  NangoIntegration,
  connectNangoIntegration,
  createNangoConnection,
  deleteNangoConnection,
  setNangoMetadata,
  startNangoSync,
} from '@crowd/nango'
import { RedisCache } from '@crowd/redis'
import { WorkflowIdReusePolicy } from '@crowd/temporal'
import { CodePlatform, Edition, PlatformType } from '@crowd/types'

import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import GithubInstallationsRepository from '@/database/repositories/githubInstallationsRepository'
import GitlabReposRepository from '@/database/repositories/gitlabReposRepository'
import IntegrationProgressRepository from '@/database/repositories/integrationProgressRepository'
import SegmentRepository from '@/database/repositories/segmentRepository'
import { IntegrationProgress, Repos } from '@/serverless/integrations/types/regularTypes'
import {
  fetchAllGitlabGroups,
  fetchGitlabGroupProjects,
  fetchGitlabUserProjects,
} from '@/serverless/integrations/usecases/gitlab/getProjects'
import { removeGitlabWebhooks } from '@/serverless/integrations/usecases/gitlab/removeWebhooks'
import { setupGitlabWebhooks } from '@/serverless/integrations/usecases/gitlab/setupWebhooks'
import { getUserSubscriptions } from '@/serverless/integrations/usecases/groupsio/getUserSubscriptions'
import {
  GroupsioGetToken,
  GroupsioIntegrationData,
  GroupsioVerifyGroup,
} from '@/serverless/integrations/usecases/groupsio/types'

import { DISCORD_CONFIG, GITHUB_CONFIG, GITLAB_CONFIG, IS_TEST_ENV, KUBE_MODE } from '../conf/index'
import GitReposRepository from '../database/repositories/gitReposRepository'
import GithubReposRepository from '../database/repositories/githubReposRepository'
import IntegrationRepository from '../database/repositories/integrationRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import telemetryTrack from '../segment/telemetryTrack'
import track from '../segment/track'
import { ILinkedInOrganization } from '../serverless/integrations/types/linkedinTypes'
import { getInstalledRepositories } from '../serverless/integrations/usecases/github/rest/getInstalledRepositories'
import {
  GitHubStats,
  getGitHubRemoteStats,
} from '../serverless/integrations/usecases/github/rest/getRemoteStats'
import { getOrganizations } from '../serverless/integrations/usecases/linkedin/getOrganizations'
import getToken from '../serverless/integrations/usecases/nango/getToken'
import { getIntegrationRunWorkerEmitter } from '../serverless/utils/queueService'
import { ConfluenceIntegrationData } from '../types/confluenceTypes'
import { JiraIntegrationData } from '../types/jiraTypes'

import { IServiceOptions } from './IServiceOptions'
import { CollectionService } from './collectionService'

const discordToken = DISCORD_CONFIG.token || DISCORD_CONFIG.token2

export default class IntegrationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async createOrUpdate(data, transaction: Transaction, options?: IRepositoryOptions) {
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
      this.options.log.error(error)
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

  static isCodePlatform(value: string): value is CodePlatform {
    return [
      PlatformType.GITHUB,
      PlatformType.GITHUB_NANGO,
      PlatformType.GITLAB,
      PlatformType.GIT,
      PlatformType.GERRIT,
    ].includes(value as PlatformType)
  }

  async create(data, transaction?: any, options?: IRepositoryOptions) {
    try {
      const txOptions = {
        ...(options || this.options),
        transaction,
      }

      const integration = await IntegrationRepository.create(data, txOptions)

      const collectionService = new CollectionService(txOptions)

      const [insightsProject] = await collectionService.findInsightsProjectsBySegmentId(
        integration.segmentId,
      )

      if (!insightsProject) {
        this.options.log.info(
          `The segmentId: ${integration.segmentId} does not have any InsightsProject related`,
        )
        return integration
      }

      const { segmentId, id: insightsProjectId } = insightsProject
      const { platform } = data

      const repositories = IntegrationService.isCodePlatform(platform)
        ? await this.syncSegmentRepositories({
            insightsProjectId,
            integrationId: integration.id,
            segmentId,
            txOptions,
          })
        : insightsProject.repositories || []

      await this.updateInsightsProject({
        insightsProjectId,
        isFirstUpdate: true,
        platform,
        repositories,
        segmentId,
        transaction,
      })

      return integration
    } catch (error) {
      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'integration')
      throw error
    }
  }

  async update(id, data, transaction?: any, options?: IRepositoryOptions) {
    try {
      const txOptions = {
        ...(options || this.options),
        transaction,
      }

      const integration = await IntegrationRepository.update(id, data, txOptions)

      const collectionService = new CollectionService(txOptions)

      const [insightsProject] = await collectionService.findInsightsProjectsBySegmentId(
        integration.segmentId,
      )

      let repositories = []
      const { platform } = data

      if (insightsProject) {
        const { segmentId, id: insightsProjectId } = insightsProject

        repositories = IntegrationService.isCodePlatform(platform)
          ? await this.syncSegmentRepositories({
              insightsProjectId,
              integrationId: integration.id,
              segmentId,
              txOptions,
            })
          : insightsProject.repositories || []

        await this.updateInsightsProject({
          insightsProjectId,
          platform,
          repositories,
          segmentId,
          transaction,
        })
      } else {
        const currentRepositories = await collectionService.findRepositoriesForSegment(
          integration.segmentId,
        )
        repositories = Object.values(currentRepositories).flatMap((repos) =>
          repos.map((repo) => repo.url),
        )
      }

      if (IntegrationService.isCodePlatform(platform) && platform !== PlatformType.GIT) {
        await this.gitConnectOrUpdate(
          {
            remotes: repositories.map((url) => ({ url, forkedFrom: null })),
          },
          txOptions,
        )
      }

      return integration
    } catch (err) {
      this.options.log.error(err)
      SequelizeRepository.handleUniqueFieldError(err, this.options.language, 'integration')

      throw err
    }
  }

  private async updateInsightsProject({
    insightsProjectId,
    isFirstUpdate = false,
    platform,
    segmentId,
    transaction,
    repositories,
  }: {
    insightsProjectId: string
    isFirstUpdate?: boolean
    platform: PlatformType
    segmentId: string
    transaction: Transaction
    repositories: string[]
  }) {
    const collectionService = new CollectionService({ ...this.options, transaction })

    const data: Partial<ICreateInsightsProject> = {}
    const { widgets } = await collectionService.findSegmentsWidgetsById(segmentId)
    data.widgets = widgets
    data.repositories = repositories

    if (
      (platform === PlatformType.GITHUB || platform === PlatformType.GITHUB_NANGO) &&
      isFirstUpdate
    ) {
      const githubInsights = await collectionService.findGithubInsightsForSegment(segmentId)

      if (githubInsights) {
        this.options.log.info(`Static Insights found: ${JSON.stringify(githubInsights)}`)
        await this.options.temporal.workflow.start('automaticCategorization', {
          taskQueue: 'categorization',
          workflowId: `categorization/${segmentId}`,
          workflowIdReusePolicy:
            WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
          retry: {
            maximumAttempts: 10,
          },
          args: [
            {
              description: githubInsights.description,
              github: githubInsights.github,
              topics: githubInsights.topics,
              website: githubInsights.website,
              segmentId,
            },
          ],
        })

        data.description = githubInsights.description
        data.github = githubInsights.github
        data.keywords = githubInsights.topics
        data.logoUrl = githubInsights.logoUrl
        data.name = githubInsights.name
        data.twitter = githubInsights.twitter
        data.website = githubInsights.website
      }
    }

    this.options.log.info(`Insight Project updated: ${insightsProjectId}`)

    await collectionService.updateInsightsProject(insightsProjectId, data)
  }

  async destroyAll(ids) {
    const toRemoveRepo = new Set<string>()
    let segmentId
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        let integration
        try {
          integration = await this.findById(id)

          if (integration.segmentId) {
            segmentId = integration.segmentId
          }
        } catch (err) {
          throw new Error404()
        }
        // remove github remotes from git integration
        if (
          integration.platform === PlatformType.GITHUB ||
          integration.platform === PlatformType.GITLAB ||
          integration.platform === PlatformType.GITHUB_NANGO
        ) {
          let shouldUpdateGit: boolean
          const mapping =
            integration.platform === PlatformType.GITHUB ||
            integration.platform === PlatformType.GITHUB_NANGO
              ? await this.getGithubRepos(id)
              : await this.getGitlabRepos(id)

          const repos: Record<string, string[]> = mapping.reduce((acc, { url, segment }) => {
            if (!acc[segment.id]) {
              acc[segment.id] = []
            }
            acc[segment.id].push(url)
            return acc
          }, {})

          for (const [segmentId, urls] of Object.entries(repos)) {
            urls.forEach((url) => toRemoveRepo.add(url))

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
              const remainingRemotes = gitRemotes.filter((remote) => !urls.includes(remote))

              if (remainingRemotes.length === 0) {
                // If no remotes left, delete the Git integration entirely
                const gitIntegration = await IntegrationRepository.findByPlatform(
                  PlatformType.GIT,
                  segmentOptions,
                )

                // Soft delete git.repositories for git-integration V2
                await GitReposRepository.delete(gitIntegration.id, {
                  ...this.options,
                  transaction,
                })

                // Then delete the git integration
                await IntegrationRepository.destroy(gitIntegration.id, {
                  ...this.options,
                  transaction,
                })
              } else {
                // Update with remaining remotes
                await this.gitConnectOrUpdate(
                  {
                    remotes: remainingRemotes.map((url: string) => ({ url, forkedFrom: null })),
                  },
                  segmentOptions,
                )
              }
            }
          }

          if (
            integration.platform === PlatformType.GITHUB ||
            integration.platform === PlatformType.GITHUB_NANGO
          ) {
            // soft delete github repos
            await GithubReposRepository.delete(integration.id, {
              ...this.options,
              transaction,
            })

            // Also soft delete from git.repositories for git-integration V2
            try {
              // Find the Git integration ID for this segment
              const gitIntegration = await IntegrationRepository.findByPlatform(PlatformType.GIT, {
                ...this.options,
                currentSegments: [{ id: integration.segmentId } as any],
                transaction,
              })
              if (gitIntegration) {
                await GitReposRepository.delete(gitIntegration.id, {
                  ...this.options,
                  transaction,
                })
              }
            } catch (err) {
              this.options.log.info(
                'No Git integration found for segment, skipping git.repositories cleanup',
              )
            }
          }
        }

        if (integration.platform === PlatformType.GITLAB) {
          if (integration.settings.webhooks) {
            await removeGitlabWebhooks(
              integration.token,
              integration.settings.webhooks.map((hook) => hook.projectId),
              integration.settings.webhooks.map((hook) => hook.hookId),
            )
          }

          // soft delete gitlab repos
          await GitlabReposRepository.delete(integration.id, {
            ...this.options,
            transaction,
          })
        }

        await IntegrationRepository.destroy(id, {
          ...this.options,
          transaction,
        })
      }

      const collectionService = new CollectionService({ ...this.options, transaction })

      const qx = SequelizeRepository.getQueryExecutor(this.options)

      let insightsProject = null
      let widgets = []

      if (segmentId) {
        const [project] = await collectionService.findInsightsProjectsBySegmentId(segmentId)
        insightsProject = project
        const widgetsResult = await collectionService.findSegmentsWidgetsById(segmentId)
        widgets = widgetsResult.widgets
        await deleteSegmentRepositories(qx, {
          segmentId,
        })
      }

      const insightsRepo = insightsProject?.repositories ?? []
      const filteredRepos = insightsRepo.filter((repo) => !toRemoveRepo.has(repo))
      // remove duplicates
      const repositories = [...new Set<string>(filteredRepos)]

      if (insightsProject) {
        await collectionService.updateInsightsProject(insightsProject.id, { widgets, repositories })
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    const record = await IntegrationRepository.findById(id, this.options)
    if (record) {
      const segmentRepository = new SegmentRepository(this.options)
      const segment = await segmentRepository.findById(record.segmentId)
      return {
        ...record,
        segment,
      }
    }
    return record
  }

  async findAllAutocomplete(search, limit) {
    return IntegrationRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return IntegrationRepository.findAndCountAll(args, this.options)
  }

  /**
   * Retrieves global integrations for the specified tenant.
   *
   * @param {any} args - Additional arguments that define search criteria or constraints.
   * @return {Promise<any>} A promise that resolves to the list of global integrations matching the criteria.
   */
  async findGlobalIntegrations(args: any) {
    return IntegrationRepository.findGlobalIntegrations(args, this.options)
  }

  /**
   * Fetches the global count of integration statuses for a given tenant.
   *
   * @param {Object} args - Additional arguments to refine the query.
   * @return {Promise<number>} A promise that resolves to the count of global integration statuses.
   */
  async findGlobalIntegrationsStatusCount(args: any) {
    return IntegrationRepository.findGlobalIntegrationsStatusCount(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    const result = await IntegrationRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
      this.options,
    )

    // Decrypt encrypted values for Confluence and Jira integrations
    if (result.rows) {
      result.rows = result.rows.map((integration) => ({
        ...integration,
        settings: CommonIntegrationService.decryptIntegrationSettings(
          integration.platform,
          integration.settings,
        ),
      }))
    }

    return result
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

  static extractOwner(repos, options) {
    const owners = lodash.countBy(repos, 'owner')

    if (Object.keys(owners).length === 1) {
      return Object.keys(owners)[0]
    }

    options.log.warn('Multiple owners found in GitHub repos!', owners)

    // return the owner with the most repos
    return lodash.maxBy(Object.keys(owners), (owner) => owners[owner])
  }

  async connectGithub(code, installId, setupAction = 'install') {
    if (setupAction === 'request') {
      return this.createOrUpdate(
        {
          platform: PlatformType.GITHUB,
          status: 'waiting-approval',
        },
        await SequelizeRepository.createTransaction(this.options),
      )
    }

    const GITHUB_AUTH_ACCESSTOKEN_URL = 'https://github.com/login/oauth/access_token'
    const CLIENT_ID = GITHUB_CONFIG.clientId
    const CLIENT_SECRET = GITHUB_CONFIG.clientSecret

    const tokenResponse = await axios({
      method: 'post',
      url: GITHUB_AUTH_ACCESSTOKEN_URL,
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
    })

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

    const integration = await this.createOrUpdateGithubIntegration(
      {
        platform: PlatformType.GITHUB,
        token,
        settings: { updateMemberAttributes: true, orgAvatar },
        integrationIdentifier: installId,
        status: 'mapping',
      },
      repos,
    )

    return integration
  }

  async connectGithubInstallation(installId: string) {
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

    const integration = await this.createOrUpdateGithubIntegration(
      {
        platform: PlatformType.GITHUB,
        token: installToken,
        settings: { updateMemberAttributes: true, orgAvatar },
        integrationIdentifier: installId,
        status: 'mapping',
      },
      repos,
    )

    return integration
  }

  async getGithubInstallations() {
    return GithubInstallationsRepository.getInstallations(this.options)
  }

  /**
   * Creates or updates a GitHub integration, handling large repos data
   * @param integrationData The integration data to create or update
   * @param repos The repositories data
   */
  private async createOrUpdateGithubIntegration(integrationData, repos: Repos) {
    let integration
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      // Get the first repo's owner since we know all repos are from same installation
      const orgName = repos[0]?.owner

      // Create initial integration with org structure but empty repos
      const initialOrg = {
        name: orgName,
        logo: integrationData.settings.orgAvatar,
        url: `https://github.com/${orgName}`,
        fullSync: true,
        updatedAt: new Date().toISOString(),
        repos: [],
      }

      integration = await this.createOrUpdate(
        {
          ...integrationData,
          settings: {
            ...integrationData.settings,
            orgs: [initialOrg],
          },
        },
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      // Transform repos into the new format
      const transformedRepos = repos.map((repo) => ({
        name: repo.name,
        url: repo.url,
        updatedAt: repo.createdAt || new Date().toISOString(),
        forkedFrom: repo.forkedFrom || null,
      }))

      // Add repos in chunks
      const chunkSize = 100 // Process 100 repos at a time
      for (let i = 0; i < transformedRepos.length; i += chunkSize) {
        const reposChunk = transformedRepos.slice(i, i + chunkSize)
        await this.appendGitHubReposToOrg(integration.id, reposChunk)
      }

      return integration
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
  }

  private async appendGitHubReposToOrg(integrationId: string, repos: any[]) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const sequelize = SequelizeRepository.getSequelize(this.options)

    try {
      // Append repos to the first (and only) org's repos array
      const query = `
        UPDATE integrations
        SET settings = jsonb_set(
          settings,
          '{orgs,0,repos}',
          COALESCE(settings->'orgs'->0->'repos', '[]'::jsonb) || ?::jsonb
        )
        WHERE id = ?
      `

      const values = [JSON.stringify(repos), integrationId]

      await sequelize.query(query, {
        replacements: values,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async githubNangoConnect(settings, mapping, integrationId?: string) {
    const existingTransaction = SequelizeRepository.getTransaction(this.options)

    const transaction =
      existingTransaction || (await SequelizeRepository.createTransaction(this.options))

    const txOptions = {
      ...this.options,
      transaction,
    }

    const txService = new IntegrationService(txOptions)

    try {
      let integration

      if (!integrationId) {
        // create new integration
        integration = await txService.createOrUpdate(
          {
            platform: PlatformType.GITHUB_NANGO,
            settings,
            status: 'done',
          },
          transaction,
        )

        // create github mapping - this also creates git integration
        await txService.mapGithubRepos(integration.id, mapping, false)
      } else {
        // update existing integration
        integration = await txService.findById(integrationId)

        // create github mapping - this also creates git integration
        await txService.mapGithubRepos(integrationId, mapping, false)

        integration = await txService.createOrUpdate(
          {
            id: integrationId,
            platform: PlatformType.GITHUB_NANGO,
            settings: {
              ...settings,
              ...(integration.settings.cursors
                ? {
                    cursors: integration.settings.cursors,
                  }
                : {}),
              ...(integration.settings.nangoMapping
                ? {
                    nangoMapping: integration.settings.nangoMapping,
                  }
                : {}),
            },
          },
          transaction,
        )
      }

      if (!existingTransaction) {
        await SequelizeRepository.commitTransaction(transaction)
      }

      await this.options.temporal.workflow.start('syncGithubIntegration', {
        taskQueue: 'nango',
        workflowId: `github-nango-sync/${integration.id}`,
        workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
        retry: {
          maximumAttempts: 10,
        },
        args: [{ integrationIds: [integration.id] }],
      })

      return await this.findById(integration.id)
    } catch (err) {
      this.options.log.error(err, 'Error while creating or updating GitHub integration!')
      if (!existingTransaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  async mapGithubRepos(integrationId, mapping, fireOnboarding = true) {
    this.options.log.info(`Mapping GitHub repos for integration ${integrationId}!`)
    const transaction = await SequelizeRepository.createTransaction(this.options)

    const txOptions = {
      ...this.options,
      transaction,
    }
    try {
      this.options.log.info(`Updating GitHub repos mapping for integration ${integrationId}!`)
      await GithubReposRepository.updateMapping(integrationId, mapping, txOptions)

      // add the repos to the git integration
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

      const qx = SequelizeRepository.getQueryExecutor(txOptions)
      const collectionService = new CollectionService(txOptions)

      for (const [segmentId, repositories] of Object.entries(repos)) {
        this.options.log.info(`Finding insights project for segment ${segmentId}!`)
        const [insightsProject] = await collectionService.findInsightsProjectsBySegmentId(segmentId)

        if (insightsProject) {
          this.options.log.info(`Upserting segment repositories for segment ${segmentId}!`)
          await upsertSegmentRepositories(qx, {
            insightsProjectId: insightsProject.id,
            repositories,
            segmentId,
          })
          await deleteMissingSegmentRepositories(qx, {
            repositories,
            segmentId,
          })
        }
      }

      // Get integration settings to access forkedFrom data from all orgs
      const integration = await IntegrationRepository.findById(integrationId, txOptions)
      const allReposInSettings = integration.settings?.orgs?.flatMap((org) => org.repos || []) || []

      for (const [segmentId, urls] of Object.entries(repos)) {
        let isGitintegrationConfigured
        const segmentOptions: IRepositoryOptions = {
          ...txOptions,
          currentSegments: [
            {
              ...this.options.currentSegments[0],
              id: segmentId as string,
            },
          ],
        }
        try {
          this.options.log.info(`Finding Git integration for segment ${segmentId}!`)
          await IntegrationRepository.findByPlatform(PlatformType.GIT, segmentOptions)

          isGitintegrationConfigured = true
        } catch (err) {
          isGitintegrationConfigured = false
        }

        if (isGitintegrationConfigured) {
          this.options.log.info(`Finding Git integration for segment ${segmentId}!`)
          const gitInfo = await this.gitGetRemotes(segmentOptions)
          const gitRemotes = gitInfo[segmentId as string].remotes
          const allUrls = Array.from(new Set([...gitRemotes, ...urls]))
          this.options.log.info(`Updating Git integration for segment ${segmentId}!`)
          await this.gitConnectOrUpdate(
            {
              remotes: allUrls.map((url) => {
                const repoInSettings = allReposInSettings.find((r) => r.url === url)
                return { url, forkedFrom: repoInSettings?.forkedFrom || null }
              }),
            },
            segmentOptions,
          )
        } else {
          this.options.log.info(`Updating Git integration for segment ${segmentId}!`)
          await this.gitConnectOrUpdate(
            {
              remotes: urls.map((url) => {
                const repoInSettings = allReposInSettings.find((r) => r.url === url)
                return { url, forkedFrom: repoInSettings?.forkedFrom || null }
              }),
            },
            segmentOptions,
          )
        }
      }

      if (fireOnboarding) {
        this.options.log.info('Updating integration status to in-progress!')
        const integration = await IntegrationRepository.update(
          integrationId,
          { status: 'in-progress' },
          txOptions,
        )

        this.options.log.info('Sending GitHub message to int-run-worker!')
        const emitter = await getIntegrationRunWorkerEmitter()
        await emitter.triggerIntegrationRun(integration.platform, integration.id, true)
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      this.options.log.error(err, 'Error while mapping GitHub repos!')
      try {
        await SequelizeRepository.rollbackTransaction(transaction)
      } catch (rErr) {
        this.options.log.error(rErr, 'Error while rolling back transaction!')
      }
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

    this.options.log.info('Sending Discord message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

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
      await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

      return integration
    }

    this.options.log.error('LinkedIn integration is not in pending-action status!')
    throw new Error404(this.options.language, 'errors.linkedin.cantOnboardWrongStatus')
  }

  async linkedinConnect(segmentId: string) {
    const nangoId = `${segmentId}-${PlatformType.LINKEDIN}`
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
          settings: { organizations, updateMemberAttributes: true, nangoId },
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
      await emitter.triggerIntegrationRun(integration.platform, integration.id, true)
    }

    return integration
  }

  /**
   * Creates the Reddit integration and starts the onboarding
   * @param subreddits Subreddits to track
   * @returns integration object
   */
  async redditOnboard(subreddits, segmentId) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    let integration

    try {
      this.options.log.info('Creating reddit integration!')
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.REDDIT,
          settings: {
            subreddits,
            updateMemberAttributes: true,
            nangoId: `${segmentId}-${PlatformType.REDDIT}`,
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

    this.options.log.info('Sending reddit message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

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

    this.options.log.info('Sending devto message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

    return integration
  }

  /**
   * Adds/updates Git integration and syncs repositories to git.repositories table (git-integration V2)
   *
   * @param integrationData.remotes - Repository objects with url and optional forkedFrom (parent repo URL).
   *                                   If forkedFrom is null, existing DB value is preserved.
   * @param options - Optional repository options
   * @returns Integration object or null if no remotes
   */
  async gitConnectOrUpdate(
    integrationData: {
      remotes: Array<{ url: string; forkedFrom?: string | null }>
    },
    options?: IRepositoryOptions,
  ) {
    const stripGit = (url: string) => {
      if (url.endsWith('.git')) {
        return url.slice(0, -4)
      }
      return url
    }

    const remotes = integrationData.remotes.map((remote) => ({
      url: stripGit(remote.url),
      forkedFrom: remote.forkedFrom || null,
    }))

    // Early return if no remotes to avoid unnecessary processing and SQL errors
    if (!remotes || remotes.length === 0) {
      this.options.log.warn('No remotes provided - skipping git integration update')
      return null
    }

    const currentOptions = options || this.options
    const existingTransaction =
      currentOptions.transaction || SequelizeRepository.getTransaction(currentOptions)
    const transaction =
      existingTransaction || (await SequelizeRepository.createTransaction(options || this.options))
    let integration

    try {
      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GIT,
          settings: {
            remotes: remotes.map((r) => r.url), // Store only URLs in settings for backward compatibility
          },
          status: 'done',
        },
        transaction,
        options,
      )

      // upsert repositories to git.repositories in order to be processed by git-integration V2
      const qx = SequelizeRepository.getQueryExecutor({
        ...(options || this.options),
        transaction,
      })
      await syncRepositoriesToGitV2(
        qx,
        remotes,
        integration.id,
        (options || this.options).currentSegments[0].id,
      )

      // Only commit if we created the transaction ourselves
      if (!existingTransaction) {
        await SequelizeRepository.commitTransaction(transaction)
      }
    } catch (err) {
      // Only rollback if we created the transaction ourselves
      if (!existingTransaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      this.options.log.error(`gitConnectOrUpdate failed with error: ${err}`)
      throw err
    }
    return integration
  }

  async atlassianAdminConnect(adminApi: string, organizationId: string) {
    const nangoPayload = {
      params: {
        organizationId,
      },
      credentials: {
        apiKey: adminApi,
      },
    }
    const adminConnectionId = await connectNangoIntegration(
      NangoIntegration.ATLASSIAN_ADMIN,
      nangoPayload,
    )
    this.options.log.info(`Admin api connection created successfully ${adminConnectionId}`)
    return adminConnectionId
  }

  /**
   * Constructs Nango connection payload for Confluence integration
   * @param integrationData: ConfluenceIntegrationData
   * @returns Object with confluenceIntegrationType and nangoPayload
   */
  private static constructNangoConnectionPayload(integrationData: ConfluenceIntegrationData): {
    confluenceIntegrationType: NangoIntegration
    nangoPayload: any
  } {
    const ATLASSIAN_CLOUD_SUFFIX = '.atlassian.net' as const
    const baseUrl = integrationData.settings.url.trim()
    const hostname = new URL(baseUrl).hostname
    const isCloudUrl = hostname.endsWith(ATLASSIAN_CLOUD_SUFFIX)
    const subdomain = isCloudUrl ? hostname.split(ATLASSIAN_CLOUD_SUFFIX)[0] : null

    if (isCloudUrl) {
      return {
        confluenceIntegrationType: NangoIntegration.CONFLUENCE_BASIC,
        nangoPayload: {
          params: {
            subdomain,
          },
          credentials: {
            username: integrationData.settings.username,
            password: integrationData.settings.apiToken,
          },
        },
      }
    }

    return {
      confluenceIntegrationType: NangoIntegration.CONFLUENCE_DATA_CENTER,
      nangoPayload: {
        params: {
          baseUrl,
        },
        credentials: {
          // TODO: double check if this works for DC instance, once we have creds
          apiKey: integrationData.settings.apiToken,
        },
      },
    }
  }

  /**
   * Updates Confluence integration
   * @param integrationData: ConfluenceIntegrationData
   * @returns integration object
   */
  async updateConfluenceIntegration(integrationData: ConfluenceIntegrationData) {
    if (!integrationData.id) {
      throw new Error('Integration ID is required for update')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    let connectionId: string
    try {
      const existingIntegration = await IntegrationRepository.findById(
        integrationData.id,
        this.options,
      )
      if (!existingIntegration) {
        throw new Error404(this.options.language, 'errors.integration.notFound')
      }

      const existingSettings = existingIntegration.settings || {}
      const newSettings = integrationData.settings

      const hasEncryptedTokenChanged = (
        newValue: string | undefined,
        existingEncryptedValue: string | undefined,
      ): boolean => {
        if (!newValue && !existingEncryptedValue) return false
        if (!newValue || !existingEncryptedValue) return true
        return existingEncryptedValue !== encryptData(newValue)
      }

      const changes = {
        url: existingSettings.url !== newSettings.url,
        username: existingSettings.username !== newSettings.username,
        apiToken: hasEncryptedTokenChanged(newSettings.apiToken, existingSettings.apiToken),
        orgAdminApiToken: hasEncryptedTokenChanged(
          newSettings.orgAdminApiToken,
          existingSettings.orgAdminApiToken,
        ),
        orgAdminId: existingSettings.orgAdminId !== newSettings.orgAdminId,
        spaces:
          JSON.stringify((existingSettings.spaces || []).sort()) !==
          JSON.stringify((newSettings.spaces || []).sort()),
      }

      // Early return if nothing changed
      const hasAnyChanges = Object.values(changes).some((changed) => changed)
      if (!hasAnyChanges) {
        await SequelizeRepository.commitTransaction(transaction)
        return existingIntegration
      }

      connectionId = existingIntegration.id
      let adminConnectionId: string = existingSettings.adminConnectionId || undefined
      const confluenceIntegrationType: NangoIntegration = existingSettings.nangoIntegrationName
      if (changes.orgAdminApiToken || changes.orgAdminId || !adminConnectionId) {
        adminConnectionId = await this.atlassianAdminConnect(
          newSettings.orgAdminApiToken,
          newSettings.orgAdminId,
        )
      }

      if (changes.url || changes.username || changes.apiToken) {
        const { confluenceIntegrationType, nangoPayload } =
          IntegrationService.constructNangoConnectionPayload(integrationData)

        connectionId = await connectNangoIntegration(confluenceIntegrationType, nangoPayload)
      }

      await setNangoMetadata(NangoIntegration.CONFLUENCE_BASIC, connectionId, {
        spaceKeysToSync: newSettings.spaces,
        adminApiConnection: adminConnectionId,
      })

      integration = await this.createOrUpdate(
        {
          id: connectionId,
          platform: PlatformType.CONFLUENCE,
          settings: {
            ...newSettings,
            // NOTE: If you add/remove/modify encrypted fields here, remember to update
            // decryptIntegrationSettings() in the query() method to decrypt them
            apiToken: encryptData(newSettings.apiToken),
            orgAdminApiToken: encryptData(newSettings.orgAdminApiToken),
            orgAdminId: newSettings.orgAdminId,
            nangoIntegrationName: confluenceIntegrationType,
            adminConnectionId,
          },
          status: 'done',
        },
        transaction,
      )

      await startNangoSync(confluenceIntegrationType, connectionId)
      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        this.options.log.error(`Invalid url: ${integrationData.settings.url}`)
        throw new Error400(this.options.language, 'errors.confluence.invalidUrl')
      }
      if (error && error.message.includes('credentials')) {
        throw new Error400(this.options.language, 'errors.confluence.invalidCredentials')
      }
      throw error
    }
    return integration
  }

  /**
   * Connects a new Confluence integration
   * @param integrationData: ConfluenceIntegrationData
   * @returns integration object
   */
  async connectConfluenceIntegration(integrationData: ConfluenceIntegrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    let connectionId: string
    try {
      const adminConnectionId = await this.atlassianAdminConnect(
        integrationData.settings.orgAdminApiToken,
        integrationData.settings.orgAdminId,
      )
      const { confluenceIntegrationType, nangoPayload } =
        IntegrationService.constructNangoConnectionPayload(integrationData)
      this.options.log.info(
        `conflunece integration type determined: ${confluenceIntegrationType}, starting nango connection...`,
      )
      connectionId = await connectNangoIntegration(confluenceIntegrationType, nangoPayload)
      await setNangoMetadata(NangoIntegration.CONFLUENCE_BASIC, connectionId, {
        spaceKeysToSync: integrationData.settings.spaces,
        adminApiConnection: adminConnectionId,
      })
      integration = await this.createOrUpdate(
        {
          id: connectionId,
          platform: PlatformType.CONFLUENCE,
          settings: {
            ...integrationData.settings,
            // NOTE: If you add/remove/modify encrypted fields here, remember to update
            // decryptIntegrationSettings() in the query() method to decrypt them
            apiToken: encryptData(integrationData.settings.apiToken),
            orgAdminApiToken: encryptData(integrationData.settings.orgAdminApiToken),
            orgAdminId: integrationData.settings.orgAdminId,
            nangoIntegrationName: confluenceIntegrationType,
            adminConnectionId,
          },
          status: 'done',
        },
        transaction,
      )
      await startNangoSync(NangoIntegration.CONFLUENCE_BASIC, connectionId)
      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        this.options.log.error(`Invalid url: ${integrationData.settings.url}`)
        throw new Error400(this.options.language, 'errors.confluence.invalidUrl')
      }
      if (error && error.message.includes('credentials')) {
        throw new Error400(this.options.language, 'errors.confluence.invalidCredentials')
      }
      throw error
    }
    return integration
  }

  /**
   * Adds/updates Gerrit integration
   * @param integrationData  to create the integration object
   * @returns integration object
   */
  async gerritConnectOrUpdate(integrationData: any) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    let connectionId
    try {
      const orgUrl: string = integrationData.remote.orgURL

      let host: string
      if (orgUrl.startsWith('https://')) {
        host = orgUrl.slice(8)
      } else if (orgUrl.startsWith('http://')) {
        host = orgUrl.slice(7)
      } else {
        host = orgUrl
      }

      const res = await IntegrationService.getGerritServerRepos(orgUrl)
      if (integrationData.remote.enableAllRepos) {
        integrationData.remote.repoNames = res
      }

      connectionId = await createNangoConnection(NangoIntegration.GERRIT, {
        params: {
          host,
        },
      })

      if (integrationData.remote.repoNames.length > 0) {
        await setNangoMetadata(NangoIntegration.GERRIT, connectionId, {
          repos: integrationData.remote.repoNames,
        })
      }

      integration = await this.createOrUpdate(
        {
          id: connectionId,
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
                stripGit(`${integrationData.remote.orgURL}/${repo}`),
              ),
            },
            status: 'done',
          },
          transaction,
        )
      }

      await startNangoSync(NangoIntegration.GERRIT, connectionId)

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      if (connectionId) {
        await deleteNangoConnection(NangoIntegration.GERRIT, connectionId)
      }

      throw err
    }
    return integration
  }

  static async getGerritServerRepos(serverURL: string): Promise<string[]> {
    try {
      const result = await axios.get(`${serverURL}/projects/`, {})
      const str = result.data.replace(")]}'\n", '')
      const data = JSON.parse(str)

      const repos = Object.keys(data).filter(
        (key) => key !== '.github' && key !== 'All-Projects' && key !== 'All-Users',
      )
      return repos
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw new Error404('Error in getGerritServerRepos:', error)
      }
    }

    return []
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

    this.options.log.info('Sending HackerNews message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()

    this.options.log.info('Got emmiter succesfully! Triggering integration run!')

    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

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

    this.options.log.info('Sending Slack message to int-run-worker!')

    const isOnboarding: boolean = !('channels' in integration.settings)
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, isOnboarding)

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

    this.options.log.info('Sending Twitter message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

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
            nangoId: `${integrationData.segments[0]}-${PlatformType.STACKOVERFLOW}`,
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

    this.options.log.info('Sending StackOverflow message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

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

    this.options.log.info('Sending Discourse message to int-run-worker!')

    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

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
            autoImports: integrationData.autoImports,
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

    this.options.log.info('Sending Groups.io message to int-run-worker!')
    const emitter = await getIntegrationRunWorkerEmitter()
    await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

    return integration
  }

  // we need to get all user groups and subgroups he has access to
  // groups all sub groups based on a group name
  // also we would need to autoimport new groups and add them to settings - either cron job or during incremental sync

  // we might need to change settings structure of already existing integrations

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
    } catch (error) {
      this.options.log.error(error.response.data, 'Error while login into GroupsIo!')
      const errorType = String(error.response.data.type)
      const isTwoFactorRequired =
        errorType.includes('two_factor_required') || errorType.includes('2nd_factor_required')

      if (isTwoFactorRequired) {
        throw new Error400(this.options.language, 'errors.groupsio.isTwoFactorRequired')
      }
      const invalidCredentials =
        errorType.includes('invalid password') || errorType.includes('invalid email')
      if (invalidCredentials)
        throw new Error400(this.options.language, 'errors.groupsio.invalidCredentials')
      const invalid2FA = errorType.includes('2nd_factor_wrong')
      if (invalid2FA) throw new Error400(this.options.language, 'errors.groupsio.invalid2FA')
      throw error
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
      this.options.log.error('Error verifying groups.io group.', err)
      throw new Error400(this.options.language, 'errors.groupsio.invalidGroup')
    }
  }

  async groupsioGetUserSubscriptions({ cookie }: { cookie: string }) {
    try {
      const subscriptions = await getUserSubscriptions(cookie)
      return subscriptions
    } catch (error) {
      this.options.log.error('Error fetching groups.io user subscriptions:', error)
      throw new Error400(this.options.language, 'errors.groupsio.fetchSubscriptionsFailed')
    }
  }

  /**
   * Constructs Nango connection payload for Jira integration
   * @param integrationData: JiraIntegrationData
   * @returns Object with jiraIntegrationType and nangoPayload
   */
  private static constructJiraNangoConnectionPayload(integrationData: JiraIntegrationData): {
    jiraIntegrationType: NangoIntegration
    nangoPayload: any
  } {
    const ATLASSIAN_CLOUD_SUFFIX = '.atlassian.net' as const
    const baseUrl = integrationData.url.trim()
    const hostname = new URL(baseUrl).hostname
    const isCloudUrl = hostname.endsWith(ATLASSIAN_CLOUD_SUFFIX)
    const subdomain = isCloudUrl ? hostname.split(ATLASSIAN_CLOUD_SUFFIX)[0] : null

    if (isCloudUrl && integrationData.username && integrationData.apiToken) {
      return {
        jiraIntegrationType: NangoIntegration.JIRA_CLOUD_BASIC,
        nangoPayload: {
          params: {
            subdomain,
          },
          credentials: {
            username: integrationData.username,
            password: integrationData.apiToken,
          },
        },
      }
    }

    if (!isCloudUrl && integrationData.username && integrationData.apiToken) {
      return {
        jiraIntegrationType: NangoIntegration.JIRA_DATA_CENTER_BASIC,
        nangoPayload: {
          params: {
            baseUrl,
          },
          credentials: {
            username: integrationData.username,
            password: integrationData.apiToken,
          },
        },
      }
    }

    return {
      jiraIntegrationType: NangoIntegration.JIRA_DATA_CENTER_API_KEY,
      nangoPayload: {
        params: {
          baseUrl,
        },
        credentials: {
          apiKey: integrationData.personalAccessToken,
        },
      },
    }
  }

  /**
   * Updates Jira integration
   * @param integrationData: JiraIntegrationData
   * @returns integration object
   */
  async updateJiraIntegration(integrationData: JiraIntegrationData) {
    if (!integrationData.id) {
      throw new Error('Integration ID is required for update')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    let connectionId: string
    try {
      const existingIntegration = await IntegrationRepository.findById(
        integrationData.id,
        this.options,
      )
      if (!existingIntegration) {
        throw new Error404(this.options.language, 'errors.integration.notFound')
      }

      const existingSettings = existingIntegration.settings || {}
      const existingAuth = existingSettings.auth || {}
      const newAuth = {
        username: integrationData.username,
        personalAccessToken: integrationData.personalAccessToken,
        apiToken: integrationData.apiToken,
      }

      const hasEncryptedTokenChanged = (
        newValue: string | undefined | null,
        existingEncryptedValue: string | undefined | null,
      ): boolean => {
        if (!newValue && !existingEncryptedValue) return false
        if (!newValue || !existingEncryptedValue) return true
        return existingEncryptedValue !== encryptData(newValue)
      }

      const changes = {
        url: existingSettings.url !== integrationData.url,
        username: existingAuth.username !== newAuth.username,
        apiToken: hasEncryptedTokenChanged(newAuth.apiToken, existingAuth.apiToken),
        personalAccessToken: hasEncryptedTokenChanged(
          newAuth.personalAccessToken,
          existingAuth.personalAccessToken,
        ),
        projects:
          JSON.stringify((existingSettings.projects || []).sort()) !==
          JSON.stringify((integrationData.projects || []).sort()),
      }

      // Early return if nothing changed
      const hasAnyChanges = Object.values(changes).some((changed) => changed)
      if (!hasAnyChanges) {
        await SequelizeRepository.commitTransaction(transaction)
        return existingIntegration
      }

      connectionId = existingIntegration.id
      let jiraIntegrationType: NangoIntegration = existingSettings.nangoIntegrationName

      const credentialsChanged =
        changes.url || changes.username || changes.apiToken || changes.personalAccessToken

      if (credentialsChanged) {
        // credentials changed, need to create a new nango connection
        const { jiraIntegrationType: newType, nangoPayload } =
          IntegrationService.constructJiraNangoConnectionPayload(integrationData)
        jiraIntegrationType = newType

        this.options.log.info(
          `jira integration type determined: ${jiraIntegrationType}, starting nango connection...`,
        )
        connectionId = await connectNangoIntegration(jiraIntegrationType, nangoPayload)
      }

      await setNangoMetadata(jiraIntegrationType, connectionId, {
        projectIdsToSync: integrationData.projects.map((project) => project.toUpperCase()),
      })

      integration = await this.createOrUpdate(
        {
          id: connectionId,
          platform: PlatformType.JIRA,
          settings: {
            url: integrationData.url,
            auth: {
              username: integrationData.username,
              // NOTE: If you add/remove/modify encrypted fields here, remember to update
              // decryptIntegrationSettings() in the query() method to decrypt them
              personalAccessToken: integrationData.personalAccessToken
                ? encryptData(integrationData.personalAccessToken)
                : null,
              apiToken: integrationData.apiToken ? encryptData(integrationData.apiToken) : null,
            },
            nangoIntegrationName: jiraIntegrationType,
            projects: integrationData.projects?.map((project) => project.toUpperCase()) || [],
          },
          status: 'done',
        },
        transaction,
      )

      await startNangoSync(jiraIntegrationType, connectionId)
      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        this.options.log.error(`Invalid url: ${integrationData.url}`)
        throw new Error400(this.options.language, 'errors.jira.invalidUrl')
      }
      if (error && error.message.includes('credentials')) {
        throw new Error400(this.options.language, 'errors.jira.invalidCredentials')
      }
      throw error
    }
    return integration
  }

  /**
   * Connects a new Jira integration
   * @param integrationData: JiraIntegrationData
   * @returns integration object
   * @remarks
   * Supports the following authentication methods:
   * 1. Jira Cloud (basic auth): Requires URL, username, and password (API key)
   * 2. Jira Data Center (PAT): Requires URL and optionally a Personal Access Token
   * 3. Jira Data Center (basic auth): Requires URL, username, and password (API key)
   */
  async connectJiraIntegration(integrationData: JiraIntegrationData) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration: any
    let connectionId: string
    try {
      const { jiraIntegrationType, nangoPayload } =
        IntegrationService.constructJiraNangoConnectionPayload(integrationData)
      this.options.log.info(
        `jira integration type determined: ${jiraIntegrationType}, starting nango connection...`,
      )
      connectionId = await connectNangoIntegration(jiraIntegrationType, nangoPayload)

      if (integrationData.projects && integrationData.projects.length > 0) {
        await setNangoMetadata(jiraIntegrationType, connectionId, {
          projectIdsToSync: integrationData.projects.map((project) => project.toUpperCase()),
        })
      }

      integration = await this.createOrUpdate(
        {
          id: connectionId,
          platform: PlatformType.JIRA,
          settings: {
            url: integrationData.url,
            auth: {
              username: integrationData.username,
              // NOTE: If you add/remove/modify encrypted fields here, remember to update
              // decryptIntegrationSettings() in the query() method to decrypt them
              personalAccessToken: integrationData.personalAccessToken
                ? encryptData(integrationData.personalAccessToken)
                : null,
              apiToken: integrationData.apiToken ? encryptData(integrationData.apiToken) : null,
            },
            nangoIntegrationName: jiraIntegrationType,
            projects: integrationData.projects.map((project) => project.toUpperCase()),
          },
          status: 'done',
        },
        transaction,
      )
      await startNangoSync(jiraIntegrationType, connectionId)
      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        this.options.log.error(`Invalid url: ${integrationData.url}`)
        throw new Error400(this.options.language, 'errors.jira.invalidUrl')
      }
      if (error && error.message.includes('credentials')) {
        throw new Error400(this.options.language, 'errors.jira.invalidCredentials')
      }
      throw error
    }
    return integration
  }

  async getIntegrationProgress(integrationId: string): Promise<IntegrationProgress> {
    const integration = await this.findById(integrationId)
    const segments = SequelizeRepository.getCurrentSegments(this.options)

    // special case for github
    if (
      integration.platform === PlatformType.GITHUB ||
      integration.platform === PlatformType.GITHUB_NANGO
    ) {
      if (integration.status !== 'in-progress') {
        return {
          type: 'github',
          segmentId: integration.segmentId,
          segmentName: segments.find((s) => s.id === integration.segmentId)?.name,
          platform: integration.platform,
          reportStatus: 'integration-is-not-in-progress',
        }
      }

      const githubToken = await getGithubInstallationToken()

      const repos = integration.settings.orgs.flatMap((org) => org.repos) as {
        url: string
        name: string
        updatedAt: string
      }[]

      const githubRepos = await this.getGithubRepos(integrationId)
      const mappedSegments = githubRepos.map((repo) => repo.segment.id)

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
          const segments = Array.from(
            new Set([...(integration.segmentId ? [integration.segmentId] : []), ...mappedSegments]),
          )

          this.options.log.debug(
            `Evaluating cache for repos: ${repos.map((r) => r.name).join(',')} and segments: ${segments}`,
          )
          cachedStats = await IntegrationProgressRepository.getDbStatsForGithub()

          this.options.log.debug(`Caching data: ${JSON.stringify(cachedStats)}`)
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

      this.options.log.debug('Remote stats:', remoteStats)
      this.options.log.debug('DB stats:', dbStats)

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
    const currentSegments = SequelizeRepository.getCurrentSegments(this.options)

    if (currentSegments.length === 1) {
      const integrationIds =
        await IntegrationProgressRepository.getAllIntegrationsInProgressForSegment(this.options)
      return Promise.all(integrationIds.map((id) => this.getIntegrationProgress(id)))
    }

    const integrationIds =
      await IntegrationProgressRepository.getAllIntegrationsInProgressForMultipleSegments(
        this.options,
      )
    return Promise.all(integrationIds.map((id) => this.getIntegrationProgress(id)))
  }

  async getIntegrationMappedRepos(segmentId: string) {
    const segmentRepository = new SegmentRepository(this.options)
    const hasMappedRepos = await segmentRepository.hasMappedRepos(segmentId)

    if (!hasMappedRepos) {
      return null
    }

    const gitlabMappedRepos = await segmentRepository.getGitlabMappedRepos(segmentId)
    const githubMappedRepos = await segmentRepository.getGithubMappedRepos(segmentId)
    const project = await segmentRepository.mappedWith(segmentId)

    return {
      project,
      repositories: [...githubMappedRepos, ...gitlabMappedRepos],
    }
  }

  async findAlreadyMappedRepos(urls: string[], segmentId: string) {
    const segmentRepository = new SegmentRepository(this.options)

    const githubAlreadyMappedRepos = await segmentRepository.getGithubRepoUrlsMappedToOtherSegments(
      urls,
      segmentId,
    )
    const gitlabAlreadyMappedRepos = await segmentRepository.getGitlabRepoUrlsMappedToOtherSegments(
      urls,
      segmentId,
    )

    return [...githubAlreadyMappedRepos, ...gitlabAlreadyMappedRepos]
  }

  async gitlabConnect(code: string) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    let integration

    try {
      // Exchange the code for access token and refresh token
      const tokenResponse = await axios.post('https://gitlab.com/oauth/token', {
        client_id: GITLAB_CONFIG.clientId,
        client_secret: GITLAB_CONFIG.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GITLAB_CONFIG.callbackUrl,
      })

      const { access_token: accessToken, refresh_token: refreshToken } = tokenResponse.data

      // Fetch user information to get the user ID
      const userResponse = await axios.get('https://gitlab.com/api/v4/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const userId = userResponse.data.id

      // Fetch all groups
      const groups = await fetchAllGitlabGroups(accessToken)

      // Fetch projects in each group
      const groupProjects = await fetchGitlabGroupProjects(accessToken, groups)

      // Fetch projects for the current user
      const userProjects = await fetchGitlabUserProjects(accessToken, userId)

      integration = await this.createOrUpdate(
        {
          platform: PlatformType.GITLAB,
          integrationIdentifier: userId.toString(),
          token: accessToken,
          refreshToken,
          status: 'mapping',
          settings: {
            groups,
            groupProjects,
            userProjects,
            user: userResponse.data,
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

    return integration
  }

  async mapGitlabRepos(
    integrationId: string,
    mapping: Record<string, string>,
    projectIds: number[],
  ) {
    const integration = await this.findById(integrationId)

    const webhooks = await setupGitlabWebhooks(integration.token, projectIds, integrationId)

    // if any of webhooks has failed, throw an error
    if (webhooks.some((w) => w.success === false)) {
      this.options.log.error({ webhooks }, 'Failed to setup webhooks')
      throw new Error('Failed to setup webhooks')
    }

    const settings = integration.settings
    const { groupProjects, userProjects } = settings
    const allProjects = [...userProjects, ...Object.values(groupProjects).flat()]

    allProjects.forEach((project) => {
      const isInMapping = Object.keys(mapping).some((url) =>
        url.includes(project.path_with_namespace),
      )
      project.enabled = isInMapping
    })

    // Keep the original structure of groupProjects and userProjects
    settings.groupProjects = { ...groupProjects }
    settings.userProjects = [...userProjects]

    const transaction = await SequelizeRepository.createTransaction(this.options)
    const txOptions = {
      ...this.options,
      transaction,
    }

    try {
      await GitlabReposRepository.updateMapping(integrationId, mapping, txOptions)

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

        const qx = SequelizeRepository.getQueryExecutor(txOptions)
        const collectionService = new CollectionService(txOptions)

        for (const [segmentId, repositories] of Object.entries(repos)) {
          const [insightsProject] =
            await collectionService.findInsightsProjectsBySegmentId(segmentId)

          if (insightsProject) {
            await upsertSegmentRepositories(qx, {
              insightsProjectId: insightsProject.id,
              repositories,
              segmentId,
            })
            await deleteMissingSegmentRepositories(qx, {
              repositories,
              segmentId,
            })
          }
        }

        for (const [segmentId, urls] of Object.entries(repos)) {
          let isGitintegrationConfigured
          const segmentOptions: IRepositoryOptions = {
            ...txOptions,
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
            const allUrls = Array.from(new Set([...gitRemotes, ...urls]))
            await this.gitConnectOrUpdate(
              {
                remotes: allUrls.map((url) => {
                  const project = allProjects.find((p) => url.includes(p.path_with_namespace))
                  return { url, forkedFrom: project?.forkedFrom || null }
                }),
              },
              { ...segmentOptions, transaction },
            )
          } else {
            await this.gitConnectOrUpdate(
              {
                remotes: urls.map((url) => {
                  const project = allProjects.find((p) => url.includes(p.path_with_namespace))
                  return { url, forkedFrom: project?.forkedFrom || null }
                }),
              },
              { ...segmentOptions, transaction },
            )
          }
        }
      }

      const integration = await IntegrationRepository.update(
        integrationId,
        { settings: { ...settings, webhooks }, status: 'in-progress' },
        txOptions,
      )

      this.options.log.info('Sending GitLab message to int-run-worker!')
      const emitter = await getIntegrationRunWorkerEmitter()
      await emitter.triggerIntegrationRun(integration.platform, integration.id, true)

      await SequelizeRepository.commitTransaction(transaction)
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
  }

  async getGitlabRepos(integrationId): Promise<any[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    const txOptions = {
      ...this.options,
      transaction,
    }

    try {
      const mapping = await GitlabReposRepository.getMapping(integrationId, txOptions)

      await SequelizeRepository.commitTransaction(transaction)
      return mapping
    } catch (err) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw err
    }
  }

  async updateGithubIntegrationSettings(installId: string) {
    this.options.log.info(`Updating GitHub integration settings for installId: ${installId}`)

    // Find the integration by installId
    const integration: any = await IntegrationRepository.findByIdentifier(
      installId,
      PlatformType.GITHUB,
    )

    if (!integration || integration.platform !== PlatformType.GITHUB) {
      this.options.log.warn(`GitHub integration not found for installId: ${installId}`)
      throw new Error404('GitHub integration not found')
    }

    this.options.log.info(`Found integration: ${integration.id}`)

    // Get the install token
    const installToken = await IntegrationService.getInstallToken(installId)
    this.options.log.info(`Obtained install token for installId: ${installId}`)

    // Fetch all installed repositories
    const repos = await getInstalledRepositories(installToken)
    this.options.log.info(`Fetched ${repos.length} installed repositories`)

    // Update integration settings
    const currentSettings: {
      orgs: Array<{
        name: string
        logo: string
        url: string
        fullSync: boolean
        updatedAt: string
        repos: Array<{
          name: string
          url: string
          updatedAt: string
        }>
      }>
    } = integration.settings || { orgs: [] }

    if (currentSettings.orgs.length !== 1) {
      throw new Error('Integration settings must have exactly one organization')
    }

    const currentRepos = currentSettings.orgs[0].repos || []
    const newRepos = repos.filter((repo) => !currentRepos.some((r) => r.url === repo.url))
    this.options.log.info(`Found ${newRepos.length} new repositories`)

    const updatedSettings = {
      ...currentSettings,
      orgs: [
        {
          ...currentSettings.orgs[0],
          repos: [
            ...currentRepos,
            ...newRepos.map((repo) => ({
              name: repo.name,
              url: repo.url,
              updatedAt: repo.updatedAt || new Date().toISOString(),
            })),
          ],
        },
      ],
    }

    this.options = {
      ...this.options,
      currentSegments: [
        {
          id: integration.segmentId,
        } as any,
      ],
    }

    // Update the integration with new settings
    await this.update(integration.id, { settings: updatedSettings })

    this.options.log.info(`Updated integration settings for integration id: ${integration.id}`)

    // Update GitHub repos mapping
    const defaultSegmentId = integration.segmentId
    const mapping = {}
    for (const repo of newRepos) {
      mapping[repo.url] = defaultSegmentId
    }
    if (Object.keys(mapping).length > 0) {
      // false - not firing onboarding
      await this.mapGithubRepos(integration.id, mapping, false)
      this.options.log.info(`Updated GitHub repos mapping for integration id: ${integration.id}`)
    } else {
      this.options.log.info(`No new repos to map for integration id: ${integration.id}`)
    }

    this.options.log.info(
      `Completed updating GitHub integration settings for installId: ${installId}`,
    )
    return integration
  }

  private async syncSegmentRepositories({
    insightsProjectId,
    integrationId,
    segmentId,
    txOptions,
  }: {
    insightsProjectId: string
    integrationId: string
    segmentId: string
    txOptions: IRepositoryOptions
  }) {
    const qx = SequelizeRepository.getQueryExecutor(txOptions)

    const collectionService = new CollectionService(txOptions)

    const reposToBeRemoved = await collectionService.findNangoRepositoriesToBeRemoved(integrationId)

    const currentRepositories = await collectionService.findRepositoriesForSegment(segmentId)

    const currentUrls = Object.values(currentRepositories).flatMap((repos) =>
      repos.map((repo) => repo.url),
    )

    const alreadyMappedRepos = await this.findAlreadyMappedRepos(currentUrls, segmentId)

    for (const repo of reposToBeRemoved) {
      await collectionService.unmapGithubRepo(integrationId, repo)
      await collectionService.unmapGitlabRepo(integrationId, repo)
    }

    const repositories = [...new Set(currentUrls)].filter(
      (url) => !reposToBeRemoved.includes(url) && !alreadyMappedRepos.includes(url),
    )

    await upsertSegmentRepositories(qx, {
      insightsProjectId,
      repositories,
      segmentId,
    })

    await deleteMissingSegmentRepositories(qx, {
      repositories,
      segmentId,
    })

    return repositories
  }
}
