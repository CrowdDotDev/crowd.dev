import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG, WORKER_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'
import { ApiPubSubEmitter, getRedisClient } from '@crowd/redis'
import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting integration run worker...')
  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const runWorkerEmitter = new IntegrationRunWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  const integrationSyncWorkerEmitter = new IntegrationSyncWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )

  const apiPubSubEmitter = new ApiPubSubEmitter(redis, log)

  const queue = new WorkerQueueReceiver(
    WORKER_CONFIG().queuePriorityLevel,
    sqsClient,
    redis,
    dbConnection,
    streamWorkerEmitter,
    runWorkerEmitter,
    searchSyncWorkerEmitter,
    integrationSyncWorkerEmitter,
    apiPubSubEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await streamWorkerEmitter.init()
    await runWorkerEmitter.init()
    await searchSyncWorkerEmitter.init()
    await integrationSyncWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
