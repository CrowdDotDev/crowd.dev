import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import DataSinkRepository from '@/repo/dataSink.repo'
import { partition } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DataSinkWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

const batchSize = 500

const tracer = getServiceTracer()
const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, tracer, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new DataSinkRepository(store, log)
  let count = 0

  let results = await repo.getFailedResults(1, batchSize)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    const messages = results.map((r) => {
      return {
        payload: new ProcessIntegrationResultQueueMessage(r.id),
        groupId: r.id,
        deduplicationId: r.id,
      }
    })

    const batches = partition(messages, 10)
    for (const batch of batches) {
      await emitter.sendMessages(batch)
    }

    count += results.length
    log.info(`Restarted total of ${count} failed results.`)

    results = await repo.getFailedResults(1, batchSize)
  }
})
