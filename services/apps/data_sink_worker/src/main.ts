import { getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { NodejsWorkerEmitter, getSqsClient } from '@crowd/sqs'
import {
  DB_CONFIG,
  SENTIMENT_CONFIG,
  SQS_CONFIG,
  REDIS_CONFIG,
  SEARCH_SYNC_API_CONFIG,
} from './conf'
import { WorkerQueueReceiver } from './queue'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { getRedisClient } from '@crowd/redis'
import { processOldResultsJob } from './jobs/processOldResults'
import { SearchSyncApiClient } from '@crowd/httpclients'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 3
const PROCESSING_INTERVAL_MINUTES = 5

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const redisClient = await getRedisClient(REDIS_CONFIG())

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, tracer, log)

  const searchSyncApi = new SearchSyncApiClient(SEARCH_SYNC_API_CONFIG())

  const queue = new WorkerQueueReceiver(
    sqsClient,
    dbConnection,
    nodejsWorkerEmitter,
    redisClient,
    searchSyncApi,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await nodejsWorkerEmitter.init()

    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldResultsJob(
            dbConnection,
            redisClient,
            nodejsWorkerEmitter,
            searchSyncApi,
            log,
          )
        }
      } catch (err) {
        log.error(err, 'Failed to process old results!')
      } finally {
        processing = false
      }
    }, PROCESSING_INTERVAL_MINUTES * 60 * 1000)
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
