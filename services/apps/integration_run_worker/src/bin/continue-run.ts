import { IntegrationStreamWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import IntegrationRunRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/integrationRun.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { IntegrationRunState } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const runId = processArguments[0]

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(queueClient, log)
  await emitter.init()

  const repo = new IntegrationRunRepository(store, log)

  const run = await repo.findIntegrationRunById(runId)

  if (run) {
    log.info({ run }, 'Found run!')

    if (run.state != IntegrationRunState.PENDING) {
      log.warn(`Integration run is not pending, setting to pending!`)

      await repo.resetDelayedRun(run.id)
    }

    log.info(`Triggering integration run for ${runId}!`)

    await emitter.continueProcessingRunStreams(run.onboarding, run.platform, run.id)
    process.exit(0)
  } else {
    log.error({ run }, 'Run not found!')
    process.exit(1)
  }
})
