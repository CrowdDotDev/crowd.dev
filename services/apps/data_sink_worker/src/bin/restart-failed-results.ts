import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import DataSinkRepository from '@/repo/dataSink.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { DataSinkWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: runId')
  process.exit(1)
}

const runId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new DataSinkRepository(store, log)

  let results = await repo.getFailedResultsForRun(runId, 1, 20)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    for (const result of results) {
      await emitter.sendMessage(
        `results-${result.tenantId}-${result.platform}`,
        new ProcessIntegrationResultQueueMessage(result.id),
      )
    }

    results = await repo.getFailedResultsForRun(runId, 1, 20)
  }
})
