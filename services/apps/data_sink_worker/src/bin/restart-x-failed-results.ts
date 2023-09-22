import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import DataSinkRepository from '@/repo/dataSink.repo'
import { partition } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DataSinkWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

const MAX_TO_PROCESS = 500

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: numResults')
  process.exit(1)
}

let numResults = parseInt(processArguments[0], 10)

numResults = Math.min(numResults, MAX_TO_PROCESS)

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, tracer, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new DataSinkRepository(store, log)

  const results = await repo.getFailedResults(1, numResults)

  if (results.length === 0) {
    log.info('No results to restart.')
    process.exit(0)
  }

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

  log.info(`Restarted total of ${results.length} failed results.`)
})
