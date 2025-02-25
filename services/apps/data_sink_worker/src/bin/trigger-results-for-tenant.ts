import { generateUUIDv1, partition } from '@crowd/common'
import { DataSinkWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { DataSinkWorkerQueueMessageType } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const log = getServiceLogger()

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(queueClient, log)
  await dataSinkWorkerEmitter.init()

  const repo = new DataSinkRepository(store, log)
  let count = 0
  const batchSize = 2000
  let resultIds = await repo.getOldResultsToProcessForTenant(batchSize)

  while (resultIds.length > 0) {
    const lastResultId = resultIds[resultIds.length - 1]
    const batches = partition(resultIds, 10)

    const promises = batches.map((batch) => {
      const messages = batch.map((resultId) => {
        return {
          payload: {
            type: DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT,
            resultId,
          },
          groupId: generateUUIDv1(),
          deduplicationId: resultId,
        }
      })
      const promise = dataSinkWorkerEmitter.sendMessages(messages).then(() => {
        count += messages.length
      })

      return promise
    })

    await Promise.all(promises)
    log.info(`Processed ${count} results!`)

    resultIds = await repo.getOldResultsToProcessForTenant(batchSize, lastResultId)
  }

  process.exit(0)
})
