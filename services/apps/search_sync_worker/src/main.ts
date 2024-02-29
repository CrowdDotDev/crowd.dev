import { OpenSearchService, InitService } from '@crowd/opensearch'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SERVICE_CONFIG, SQS_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 3

setImmediate(async () => {
  log.info('Starting search sync worker...')

  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), 5)

  const worker = new WorkerQueueReceiver(
    SERVICE_CONFIG().queuePriorityLevel,
    redis,
    sqsClient,
    dbConnection,
    openSearchService,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  process.on('SIGTERM', async () => {
    log.warn('Detected SIGTERM signal, started exiting!')
    await worker.stopAll()
  })

  const initService = new InitService(openSearchService, log)

  try {
    await initService.initialize()
    await worker.start()
  } catch (err) {
    log.error(err, 'Failed to start!')
    process.exit(1)
  }
})
