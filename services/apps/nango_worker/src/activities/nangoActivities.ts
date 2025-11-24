import { IS_DEV_ENV, IS_STAGING_ENV, singleOrDefault } from '@crowd/common'
import { CommonIntegrationService, GithubIntegrationService } from '@crowd/common_services'
import {
  addGitHubRepoMapping,
  addGithubNangoConnection,
  addRepoToGitIntegration,
  fetchIntegrationById,
  findIntegrationDataForNangoWebhookProcessing,
  removeGitHubRepoMapping,
  removeGithubNangoConnection,
  setGithubIntegrationSettingsOrgs,
  setNangoIntegrationCursor,
} from '@crowd/data-access-layer/src/integrations'
import IntegrationStreamRepository from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.repo'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getChildLogger } from '@crowd/logging'
import {
  ALL_NANGO_INTEGRATIONS,
  NangoIntegration,
  createNangoGithubConnection,
  deleteNangoConnection,
  getNangoCloudRecords,
  getNangoConnectionData,
  getNangoConnections,
  initNangoCloudClient,
  startNangoSync as startNangoSyncCloud,
} from '@crowd/nango'
import { RedisCache } from '@crowd/redis'
import { IntegrationResultType, PlatformType } from '@crowd/types'

import { svc } from '../main'
import {
  IGithubIntegrationSyncInstructions,
  IGithubRepoData,
  IProcessNangoWebhookArguments,
} from '../types'

async function setLastConnectTs(): Promise<void> {
  const redisCache = new RedisCache('nangoGh', svc.redis, svc.log)
  await redisCache.set('lastConnectTs', new Date().toISOString())
}

async function getLastConnectTs(): Promise<Date | undefined> {
  const redisCache = new RedisCache('nangoGh', svc.redis, svc.log)
  const lastConnect = await redisCache.get('lastConnectTs')
  if (!lastConnect) {
    return undefined
  }

  return new Date(lastConnect)
}

export async function numberOfGithubConnectionsToCreate(): Promise<number> {
  const max = Number(process.env.CROWD_MAX_GH_NANGO_CONNECTIONS_PER_HOUR || 1)

  svc.log.info(`[GITHUB] Max number of github connections to create: ${max}`)

  if (IS_DEV_ENV || IS_STAGING_ENV) {
    svc.log.info('[GITHUB] Number of github connections to create: 5')
    return 10
  }

  const lastConnectDate = await getLastConnectTs()

  svc.log.info(`[GITHUB] Last connect date: ${lastConnectDate.toISOString()}`)

  if (!lastConnectDate) {
    svc.log.info(`[GITHUB] Number of github connections to create: ${max}`)
    return max
  }

  const now = new Date()
  svc.log.info(`[GITHUB] Now: ${now.toISOString()}`)

  // time is milliseconds
  const diff = now.getTime() - lastConnectDate.getTime()

  // how many hours
  const hours = diff / (1000 * 60 * 60) // ms to seconds to minutes
  svc.log.info(`[GITHUB] Diff: ${diff}, hours: ${hours}`)

  if (hours >= 1.0) {
    svc.log.info(`[GITHUB] Number of github connections to create: ${max}`)
    return max
  }

  svc.log.info('[GITHUB] Number of github connections to create: 0')
  return 0
}

export async function processNangoWebhook(
  args: IProcessNangoWebhookArguments,
): Promise<string | undefined> {
  let logger = getChildLogger(processNangoWebhook.name, svc.log, {
    provider: args.providerConfigKey,
    connectionId: args.connectionId,
    model: args.model,
  })

  if (!ALL_NANGO_INTEGRATIONS.includes(args.providerConfigKey as NangoIntegration)) {
    logger.info({ providerConfigKey: args.providerConfigKey }, 'Skipping non-Nango integration!')
    return
  }

  const integration = await findIntegrationDataForNangoWebhookProcessing(
    dbStoreQx(svc.postgres.reader),
    args.connectionId,
  )

  if (!integration) {
    svc.log.warn(
      { connectionId: args.connectionId, provider: args.providerConfigKey },
      'Integration not found!',
    )
    return
  }

  logger = getChildLogger(processNangoWebhook.name, logger, {
    integrationId: integration.id,
  })

  const settings = integration.settings
  let cursor = args.nextPageCursor
  if (
    !cursor &&
    settings.cursors &&
    settings.cursors[args.connectionId] &&
    settings.cursors[args.connectionId][args.model]
  ) {
    cursor = settings.cursors[args.connectionId][args.model]
  }

  await initNangoCloudClient()

  const records = await getNangoCloudRecords(
    args.providerConfigKey as NangoIntegration,
    args.connectionId,
    args.model,
    cursor,
  )

  const repo = new IntegrationStreamRepository(svc.postgres.writer, logger)

  if (records.records.length > 0) {
    logger.info(`Processing ${records.records.length} nango records!`)
    for (const record of records.records) {
      // process record
      const resultId = await repo.publishExternalResult(integration.id, {
        type: IntegrationResultType.ACTIVITY,
        // github must use githubRepos to determine segmentId so we must not pass it here
        segmentId:
          args.providerConfigKey !== NangoIntegration.GITHUB ? integration.segmentId : undefined,
        data: record.activity,
      })
      await svc.dataSinkWorkerEmitter.triggerResultProcessing(
        resultId,
        resultId,
        args.syncType === 'INITIAL',
      )
    }

    if (records.nextCursor) {
      await setNangoIntegrationCursor(
        dbStoreQx(svc.postgres.writer),
        integration.id,
        args.connectionId,
        args.model,
        records.nextCursor,
      )

      return records.nextCursor
    } else {
      await setNangoIntegrationCursor(
        dbStoreQx(svc.postgres.writer),
        integration.id,
        args.connectionId,
        args.model,
        records.records[records.records.length - 1].metadata.cursor,
      )
    }
  }
}

export async function analyzeGithubIntegration(
  integrationId: string,
): Promise<IGithubIntegrationSyncInstructions> {
  const reposToDelete: {
    repo: IGithubRepoData
    connectionId: string
  }[] = []
  const duplicatesToDelete: {
    repo: IGithubRepoData
    connectionId: string
  }[] = []
  const reposToSync: IGithubRepoData[] = []

  const integration = await fetchIntegrationById(dbStoreQx(svc.postgres.writer), integrationId)

  if (integration) {
    if (integration.platform === PlatformType.GITHUB_NANGO) {
      const settings = integration.settings

      // check if we need to sync org repos
      let added = 0
      for (const org of settings.orgs) {
        if (org.fullSync) {
          const results = await GithubIntegrationService.getOrgRepos(org.name)
          for (const result of results) {
            // we didn't find the repo so we add it
            if (!org.repos.some((r) => r.url === result.url)) {
              org.repos.push(result)
              added++
            }
          }
        }
      }

      if (added > 0) {
        // we need to update the integration settings in the database
        await setGithubIntegrationSettingsOrgs(
          dbStoreQx(svc.postgres.writer),
          integrationId,
          settings.orgs,
        )
      }

      const repos = new Set<IGithubRepoData>()
      if (settings.orgs) {
        for (const org of settings.orgs) {
          for (const repo of org.repos) {
            repos.add(parseGithubUrl(repo.url))
          }
        }
      }
      if (settings.repos) {
        for (const repo of settings.repos) {
          repos.add(parseGithubUrl(repo.url))
        }
      }

      const finalRepos = Array.from(repos)

      // determine which connections to delete if needed
      if (settings.nangoMapping) {
        const nangoMapping = settings.nangoMapping as Record<string, IGithubRepoData>

        const connectionIds = Object.keys(nangoMapping)

        // check for duplicates as well by tracking which repos have connectionIds
        const existingConnectedRepos = []
        for (const connectionId of connectionIds) {
          const mappedRepo = nangoMapping[connectionId]

          if (
            existingConnectedRepos.some(
              (r) => r.owner === mappedRepo.owner && r.repoName === mappedRepo.repoName,
            )
          ) {
            // found duplicate connectionId for the same repo
            duplicatesToDelete.push({
              repo: mappedRepo,
              connectionId,
            })

            // just so that later singleOrDefault doesn't find it
            delete nangoMapping[connectionId]
          } else {
            const found = singleOrDefault(
              finalRepos,
              (r) => r.owner === mappedRepo.owner && r.repoName === mappedRepo.repoName,
            )

            // if repo is in nangoMapping but not in settings delete the connection
            if (!found) {
              reposToDelete.push({
                repo: mappedRepo,
                connectionId,
              })

              // just so that later singleOrDefault doesn't find it
              delete nangoMapping[connectionId]
            } else {
              existingConnectedRepos.push(mappedRepo)
            }
          }
        }
      }

      // determine which repos to sync if needed
      if (!settings.nangoMapping) {
        // if we don't have any mapping yet we need to sync all repos (create connections)
        reposToSync.push(...finalRepos)
      } else {
        const nangoMapping = settings.nangoMapping as Record<string, IGithubRepoData>

        // find all repos that are not in nangoMapping
        for (const repo of finalRepos) {
          const found = singleOrDefault(
            Object.keys(nangoMapping),
            (connectionId) =>
              nangoMapping[connectionId].owner === repo.owner &&
              nangoMapping[connectionId].repoName === repo.repoName,
          )

          if (!found) {
            reposToSync.push(repo)
          }
        }
      }

      svc.log.info(
        `For integration ${integrationId} found ${reposToSync.length} repositories to create nango connections for and ${reposToDelete.length} connections to delete!`,
      )
    } else {
      svc.log.warn(`Integration ${integrationId} is not a Github Nango integration!`)
    }
  } else {
    svc.log.warn(`Integration ${integrationId} not found!`)
  }

  return {
    providerConfigKey: NangoIntegration.GITHUB,
    reposToDelete,
    duplicatesToDelete,
    reposToSync,
  }
}

export async function createGithubConnection(
  integrationId: string,
  repo: IGithubRepoData,
): Promise<string> {
  svc.log.info({ integrationId }, `Creating nango connection repo ${repo.owner}/${repo.repoName}!`)

  await initNangoCloudClient()

  const allNangoConnections = await getNangoConnections()

  const tokenConnectionIds = allNangoConnections
    .filter(
      (c) =>
        c.provider_config_key === NangoIntegration.GITHUB &&
        c.connection_id.toLowerCase().startsWith('github-token-'),
    )
    .map((c) => c.connection_id)

  if (tokenConnectionIds.length === 0) {
    throw new Error('No github token connections found!')
  }

  const connectionData = await getNangoConnectionData(
    NangoIntegration.GITHUB,
    tokenConnectionIds[Math.floor(Math.random() * tokenConnectionIds.length)],
  )

  const connectionId = await createNangoGithubConnection(
    repo.repoName,
    repo.owner,
    tokenConnectionIds,
    connectionData.connection_config.app_id,
    connectionData.connection_config.installation_id,
    integrationId,
  )

  await setLastConnectTs()

  return connectionId
}

export async function setGithubConnection(
  integrationId: string,
  repo: IGithubRepoData,
  connectionId: string,
): Promise<void> {
  svc.log.info(
    { integrationId },
    `Setting github connection for repo ${repo.owner}/${repo.repoName}!`,
  )
  // store connectionId - repo mapping in integration.settings.nangoMapping object
  await addGithubNangoConnection(
    dbStoreQx(svc.postgres.writer),
    integrationId,
    connectionId,
    repo.owner,
    repo.repoName,
  )
}

export async function removeGithubConnection(
  integrationId: string,
  connectionId: string,
): Promise<void> {
  svc.log.info({ integrationId }, `Removing github connection ${connectionId}!`)
  // remove connectionId - repo mapping from integration.settings.nangoMapping object
  await removeGithubNangoConnection(dbStoreQx(svc.postgres.writer), integrationId, connectionId)
}

export async function startNangoSync(
  integrationId: string,
  providerConfigKey: string,
  connectionId: string,
): Promise<void> {
  svc.log.info(
    { integrationId },
    `Starting nango sync for connection ${connectionId} for provider ${providerConfigKey}!`,
  )

  await initNangoCloudClient()
  await startNangoSyncCloud(providerConfigKey as NangoIntegration, connectionId)
}

export async function deleteConnection(
  integrationId: string,
  providerConfigKey: string,
  connectionId: string,
): Promise<void> {
  svc.log.info(
    { integrationId },
    `Deleting nango connection ${connectionId} for provider ${providerConfigKey}!`,
  )

  await initNangoCloudClient()
  await deleteNangoConnection(providerConfigKey as NangoIntegration, connectionId)
}

export async function mapGithubRepo(integrationId: string, repo: IGithubRepoData): Promise<void> {
  svc.log.info(
    { integrationId },
    `Adding github repo mapping for integration ${integrationId} and repo ${repo.owner}/${repo.repoName}!`,
  )
  await addGitHubRepoMapping(
    dbStoreQx(svc.postgres.writer),
    integrationId,
    repo.owner,
    repo.repoName,
  )
}

export async function unmapGithubRepo(integrationId: string, repo: IGithubRepoData): Promise<void> {
  svc.log.info(
    { integrationId },
    `Removing github repo mapping for repo ${repo.owner}/${repo.repoName}!`,
  )
  // remove repo from githubRepos mapping
  await removeGitHubRepoMapping(
    dbStoreQx(svc.postgres.writer),
    svc.redis,
    integrationId,
    repo.owner,
    repo.repoName,
  )
}

export async function updateGitIntegrationWithRepo(
  integrationId: string,
  repo: IGithubRepoData,
): Promise<void> {
  svc.log.info(
    { integrationId },
    `Updating git integration with repo ${repo.owner}/${repo.repoName} for integration ${integrationId}!`,
  )
  const repoUrl = `https://github.com/${repo.owner}/${repo.repoName}`
  const forkedFrom = await GithubIntegrationService.getForkedFrom(repo.owner, repo.repoName)
  await addRepoToGitIntegration(dbStoreQx(svc.postgres.writer), integrationId, repoUrl, forkedFrom)
}

function parseGithubUrl(url: string): IGithubRepoData {
  // Create URL object
  const parsedUrl = new URL(url)

  // Get pathname (e.g., "/islet-project/3rd-kvmtool")
  const pathname = parsedUrl.pathname

  // Split by '/' and remove empty elements
  const parts = pathname.split('/').filter(Boolean)

  // First part is owner, second is repo
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repoName: parts[1],
    }
  }

  throw new Error('Invalid GitHub URL format')
}

export async function syncGithubReposToInsights(integrationId: string): Promise<void> {
  svc.log.info({ integrationId }, `Syncing GitHub repositories to insights!`)

  const qx = dbStoreQx(svc.postgres.writer)
  await CommonIntegrationService.syncGithubRepositoriesToInsights(qx, svc.redis, integrationId)
}
