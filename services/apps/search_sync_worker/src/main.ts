import { OpenSearchService, InitService } from '@crowd/opensearch'
import { getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting search sync worker...')

  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const worker = new WorkerQueueReceiver(
    redis,
    sqsClient,
    dbConnection,
    openSearchService,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  const initService = new InitService(openSearchService, log)

  try {
    await initService.initialize()
    await worker.start()
  } catch (err) {
    log.error(err, 'Failed to start!')
    process.exit(1)
  }
})
