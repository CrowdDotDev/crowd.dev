import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getClientILP, getClientSQL } from '@crowd/questdb'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG, TEMPORAL_CONFIG, WORKER_SETTINGS } from './conf'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()
const ilp = getClientILP()

const MAX_CONCURRENT_PROCESSING = 5

setImmediate(async () => {
  log.info('Starting data sink worker...')

  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const qdbConnection = await getClientSQL()

  const redisClient = await getRedisClient(REDIS_CONFIG())

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, redisClient, loader, log)

  const dataWorkerEmitter = new DataSinkWorkerEmitter(queueClient, redisClient, loader, log)

  const queue = new WorkerQueueReceiver(
    WORKER_SETTINGS().queuePriorityLevel,
    queueClient,
    dbConnection,
    qdbConnection,
    searchSyncWorkerEmitter,
    dataWorkerEmitter,
    redisClient,
    temporal,
    log,
  )

  try {
    await searchSyncWorkerEmitter.init()
    await dataWorkerEmitter.init()

    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  await ilp.flush()
  await ilp.close()
})

process.on('SIGINT', async () => {
  await ilp.flush()
  await ilp.close()
})
