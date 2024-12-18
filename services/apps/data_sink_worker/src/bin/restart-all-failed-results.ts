import { partition } from '@crowd/common'
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
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const batchSize = 500

const log = getServiceLogger()

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const redis = await getRedisClient(REDIS_CONFIG())

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const emitter = new DataSinkWorkerEmitter(queueClient, redis, loader, log)
  await emitter.init()

  const repo = new DataSinkRepository(store, log)
  let count = 0

  let results = await repo.getFailedResults(1, batchSize)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    const messages = results.map((r) => {
      return {
        tenantId: r.tenantId,
        payload: new ProcessIntegrationResultQueueMessage(r.id),
        groupId: r.id,
        deduplicationId: r.id,
      }
    })

    const batches = partition(messages, 10)
    for (const batch of batches) {
      await emitter.sendMessagesBatch(batch)
    }

    count += results.length
    log.info(`Restarted total of ${count} failed results.`)

    results = await repo.getFailedResults(1, batchSize)
  }
})
