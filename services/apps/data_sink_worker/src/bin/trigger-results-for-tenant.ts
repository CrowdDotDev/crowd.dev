import { generateUUIDv1, partition } from '@crowd/common'
import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import {
  DataSinkWorkerQueueMessageType,
  IntegrationResultState,
  QueuePriorityLevel,
} from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 2) {
  log.error('Expected 1 argument: <n> how many pending results to process')
  process.exit(1)
}

const numResults = parseInt(processArguments[0], 10)

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(queueClient, redis, loader, log)
  await dataSinkWorkerEmitter.init()

  const repo = new DataSinkRepository(store, log)
  let count = 0
  const batchSize = 100
  let resultIds = await repo.getOldResultsToProcessForTenant(batchSize, [
    IntegrationResultState.PENDING,
  ])

  while (resultIds.length > 0) {
    const lastResultId = resultIds[resultIds.length - 1].id
    const batches = partition(resultIds, 10)

    for (const batch of batches) {
      const messages = batch.map((r) => {
        return {
          tenantId: r.tenantId,
          payload: {
            type: DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT,
            resultId: r.id,
          },
          groupId: generateUUIDv1(),
          deduplicationId: r.id,
        }
      })

      await dataSinkWorkerEmitter.sendMessages(messages, QueuePriorityLevel.NORMAL)
      count += messages.length
    }

    log.info(`Processed ${count} results!`)

    if (count >= numResults) {
      break
    }

    resultIds = await repo.getOldResultsToProcessForTenant(
      batchSize,
      [IntegrationResultState.PENDING],
      lastResultId,
    )
  }

  process.exit(0)
})
