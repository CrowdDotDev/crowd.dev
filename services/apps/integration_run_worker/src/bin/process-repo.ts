import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, getSqsClient } from '@crowd/sqs'
import IntegrationRunRepository from '@/repo/integrationRun.repo'
import { IntegrationState } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const integrationId = processArguments[0]
const repoFullName = processArguments[1]

setImmediate(async () => {
  if (!integrationId) {
    log.error(`Integration id is required!`)
    process.exit(1)
  }

  if (!repoFullName) {
    log.error(`Repo full name is required!`)
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

    // we need to overrdide generate streams function here

    await emitter.triggerIntegrationRun(
      integration.tenantId,
      integration.type,
      integration.id,
      true,
      // this is to enable manual run
      true,
      // we are inject manual settings here
      { repoFullName: repoFullName },
    )
  } else {
    log.error({ integrationId }, 'Integration not found!')
    process.exit(1)
  }
})
