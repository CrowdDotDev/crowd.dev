import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, getSqsClient } from '@crowd/sqs'
import IntegrationRunRepository from '@/repo/integrationRun.repo'
import { IntegrationRunState } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const runId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG(), 1)
  const store = new DbStore(log, dbConnection)

  const repo = new IntegrationRunRepository(store, log)

  const run = await repo.findIntegrationRunById(runId)

  if (run) {
    if (run.state != IntegrationRunState.PENDING) {
      log.warn(`Integration run is not pending, setting to pending!`)

      await repo.restart(run.id)
    }

    log.info(`Triggering integration run for ${runId}!`)

    await emitter.triggerIntegrationRun(run.tenantId, run.platform, run.integrationId, true)
    process.exit(0)
  } else {
    log.error({ run }, 'Run not found!')
    process.exit(1)
  }
})
