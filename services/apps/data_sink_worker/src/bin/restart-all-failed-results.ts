import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import DataSinkRepository from '@/repo/dataSink.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { DataSinkWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new DataSinkRepository(store, log)

  let results = await repo.getFailedResults(1, 20)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    for (const result of results) {
      await emitter.sendMessage(result.id, new ProcessIntegrationResultQueueMessage(result.id))
    }

    results = await repo.getFailedResults(1, 20)
  }
})
