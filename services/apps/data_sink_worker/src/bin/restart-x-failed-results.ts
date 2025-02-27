import { partition } from '@crowd/common'
import { DataSinkWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const MAX_TO_PROCESS = 500

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: numResults')
  process.exit(1)
}

let numResults = parseInt(processArguments[0], 10)

numResults = Math.min(numResults, MAX_TO_PROCESS)

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, log)
  await emitter.init()

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
    await emitter.sendMessagesBatch(batch)
  }

  log.info(`Restarted total of ${results.length} failed results.`)
})
