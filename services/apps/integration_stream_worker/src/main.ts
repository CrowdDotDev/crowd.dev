import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, UNLEASH_CONFIG, WORKER_SETTINGS, QUEUE_CONFIG } from './conf'
import { getRedisClient } from '@crowd/redis'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { WorkerQueueReceiver } from './queue'
import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { QueueFactory } from '@crowd/queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting integration stream worker...')

  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(
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
    redisClient,
    dbConnection,
    runWorkerEmiiter,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await runWorkerEmiiter.init()
    await streamWorkerEmitter.init()
    await dataSinkWorkerEmitter.init()

    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
