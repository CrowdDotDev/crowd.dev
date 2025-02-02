import { DataSinkWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: runId')
  process.exit(1)
}

const runId = processArguments[0]

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, log)
  await emitter.init()

  const repo = new DataSinkRepository(store, log)

  let results = await repo.getFailedResultsForRun(runId, 1, 20)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    for (const result of results) {
      await emitter.triggerResultProcessing(
        result.platform,
        result.id,
        result.id,
        result.onboarding === null ? true : result.onboarding,
        result.id,
      )
    }

    results = await repo.getFailedResultsForRun(runId, 1, 20)
  }
})
