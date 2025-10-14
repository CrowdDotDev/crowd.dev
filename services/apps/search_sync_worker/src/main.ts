import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { InitService, OpenSearchService, getOpensearchClient } from '@crowd/opensearch'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, OPENSEARCH_CONFIG, QUEUE_CONFIG, REDIS_CONFIG, SERVICE_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'

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
