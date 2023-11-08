import { getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter, getSqsClient } from '@crowd/sqs'
import {
  DB_CONFIG,
  SENTIMENT_CONFIG,
  SQS_CONFIG,
  REDIS_CONFIG,
  UNLEASH_CONFIG,
  TEMPORAL_CONFIG,
} from './conf'
import { WorkerQueueReceiver } from './queue'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { getRedisClient } from '@crowd/redis'
import { processOldResultsJob } from './jobs/processOldResults'
import { getUnleashClient } from '@crowd/feature-flags'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 4
const PROCESSING_INTERVAL_MINUTES = 4

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const redisClient = await getRedisClient(REDIS_CONFIG())

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, tracer, log)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(sqsClient, tracer, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    dbConnection,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    redisClient,
    unleash,
    temporal,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await nodejsWorkerEmitter.init()
    await searchSyncWorkerEmitter.init()

    let processing = false
    setInterval(async () => {
      try {
        log.info('Checking for old results to process...')
        if (!processing) {
          processing = true
          log.info('Processing old results...')
          await processOldResultsJob(
            dbConnection,
            redisClient,
            nodejsWorkerEmitter,
            searchSyncWorkerEmitter,
            unleash,
            temporal,
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
