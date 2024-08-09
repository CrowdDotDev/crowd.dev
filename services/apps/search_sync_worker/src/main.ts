import { OpenSearchService, InitService, getOpensearchClient } from '@crowd/opensearch'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SERVICE_CONFIG, QUEUE_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'
import { QueueFactory } from '@crowd/queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 5

setImmediate(async () => {
  log.info('Starting search sync worker...')

  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const redis = await getRedisClient(REDIS_CONFIG())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const worker = new WorkerQueueReceiver(
    SERVICE_CONFIG().queuePriorityLevel,
    redis,
    queueClient,
    dbConnection,
    openSearchService,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  const initService = new InitService(openSearchService)

  try {
    await initService.initialize()
    await worker.start()
  } catch (err) {
    log.error(err, 'Failed to start!')
    process.exit(1)
  }
})
