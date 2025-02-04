import { DataSinkWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: resultIds')
  process.exit(1)
}

const resultIds = processArguments[0].split(',')

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, log)
  await emitter.init()

  const repo = new DataSinkRepository(store, log)
  for (const resultId of resultIds) {
    const result = await repo.getResultInfo(resultId)
    if (!result) {
      log.error(`Result ${resultId} not found!`)
      process.exit(1)
    } else {
      await repo.resetResults([resultId])
      await emitter.triggerResultProcessing(
        result.id,
        result.id,
        result.onboarding === null ? true : result.onboarding,
      )
    }
  }
})
