import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, getSqsClient } from '@crowd/sqs'
import IntegrationRunRepository from '@/repo/integrationRun.repo'
import { IntegrationState } from '@crowd/types'
import {
  GithubIntegrationSettings,
  GithubManualIntegrationSettings,
  GithubManualStreamType,
} from '@crowd/integrations'

const mapStreamTypeToEnum = (stream: string): GithubManualStreamType => {
  switch (stream) {
    case 'stars':
      return GithubManualStreamType.STARGAZERS
    case 'forks':
      return GithubManualStreamType.FORKS
    case 'pulls':
      return GithubManualStreamType.PULLS
    case 'issues':
      return GithubManualStreamType.ISSUES
    case 'discussions':
      return GithubManualStreamType.DISCUSSIONS
    case 'all':
      return GithubManualStreamType.ALL
    default:
      // wrong stream type
      return null
  }
}

// example call
// npm run script:process-repo 5f8b1a3a-0b0a-4c0a-8b0a-4c0a8b0a4c0a  CrowdDotDev/crowd.dev stars

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const integrationId = processArguments[0]
const repoFullName = processArguments[1] // it should be in format of owner/repo

// this is optional, if not provided we will trigger all streams
// if provided we will trigger only this stream type
// possible values are: stars, forks, pulls, issues, discussions, all
const streamString = processArguments.length > 2 ? processArguments[2] : null
const streamType = streamString ? mapStreamTypeToEnum(streamString) : GithubManualStreamType.ALL

const repoURL = `https://github.com/${repoFullName}`

setImmediate(async () => {
  if (!integrationId) {
    log.error(`Integration id is required!`)
    process.exit(1)
  }

  if (!repoFullName) {
    log.error(`Repo full name is required!`)
    process.exit(1)
  }

  if (!streamType) {
    log.error(`Unknown stream type provided!`)
    process.exit(1)
  }

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG(), 1)
  const store = new DbStore(log, dbConnection)

  const repo = new IntegrationRunRepository(store, log)

  const integration = await repo.getIntegrationData(integrationId)

  if (integration) {
    if (integration.state == IntegrationState.IN_PROGRESS) {
      log.warn(`Integration already running!`)
      process.exit(1)
    }

    if (integration.state == IntegrationState.INACTIVE) {
      log.warn(`Integration is not active!`)
      process.exit(1)
    }

    if (integration.state == IntegrationState.WAITING_APPROVAL) {
      log.warn(`Integration is waiting for approval!`)
      process.exit(1)
    }

    log.info(`Triggering integration run for ${integrationId}!`)

    // let's get current settings from integration
    const currentSettings = (await repo.getIntegrationSettings(
      integrationId,
    )) as GithubIntegrationSettings

    // let's check if requested repo exists in current settings
    const repoExists = currentSettings.repos.find((r) => r.url === repoURL)

    if (!repoExists) {
      log.error(`Repo ${repoURL} is not configured in integration settings, skiping!`)
      process.exit(1)
    }

    const settings: GithubManualIntegrationSettings = {
      repos: [repoExists],
      unavailableRepos: [],
      streamType,
    }

    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.type,
      integration.id,
      false, // disable onboarding
      true, // this is to enable manual run
      settings, // we are injecting manual settings here
    )
  } else {
    log.error({ integrationId }, 'Integration not found!')
    process.exit(1)
  }
})
