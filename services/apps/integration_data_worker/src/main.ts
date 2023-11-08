import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { getRedisClient } from '@crowd/redis'
import { getDbConnection } from '@crowd/database'
import { DataSinkWorkerEmitter, IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { WorkerQueueReceiver } from './queue'
import { processOldDataJob } from './jobs/processOldData'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 3
const PROCESSING_INTERVAL_MINUTES = 2

setImmediate(async () => {
  log.info('Starting integration data worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, tracer, log)
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(sqsClient, tracer, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    redisClient,
    dbConnection,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await streamWorkerEmitter.init()
    await dataSinkWorkerEmitter.init()

    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldDataJob(
            dbConnection,
            redisClient,
            streamWorkerEmitter,
            dataSinkWorkerEmitter,
            log,
          )
        }
      } catch (err) {
        log.error(err, 'Failed to process old data!')
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
