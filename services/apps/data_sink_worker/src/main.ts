import {
  PriorityLevelContextRepository,
  DataSinkWorkerEmitter,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import {
  DB_CONFIG,
  REDIS_CONFIG,
  UNLEASH_CONFIG,
  TEMPORAL_CONFIG,
  WORKER_SETTINGS,
  QUEUE_CONFIG,
} from './conf'
import { WorkerQueueReceiver } from './queue'
import { getRedisClient } from '@crowd/redis'
import { getUnleashClient } from '@crowd/feature-flags'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 5

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const redisClient = await getRedisClient(REDIS_CONFIG())

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )

  const dataWorkerEmitter = new DataSinkWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )

  const queue = new WorkerQueueReceiver(
    WORKER_SETTINGS().queuePriorityLevel,
    queueClient,
    dbConnection,
    searchSyncWorkerEmitter,
    dataWorkerEmitter,
    redisClient,
    unleash,
    temporal,
    tracer,
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
