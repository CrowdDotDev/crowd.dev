import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { getRedisClient } from '@crowd/redis'
import { getDbConnection } from '@crowd/database'
import {
  IntegrationRunWorkerEmitter,
  IntegrationDataWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import { WorkerQueueReceiver } from './queue'
import { processOldStreamsJob } from './jobs/processOldStreams'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2
const PROCESSING_INTERVAL_MINUTES = 5

setImmediate(async () => {
  log.info('Starting integration stream worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(sqsClient, tracer, log)
  const dataWorkerEmitter = new IntegrationDataWorkerEmitter(sqsClient, tracer, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, tracer, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    redisClient,
    dbConnection,
    runWorkerEmiiter,
    dataWorkerEmitter,
    streamWorkerEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await runWorkerEmiiter.init()
    await dataWorkerEmitter.init()
    await streamWorkerEmitter.init()

    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldStreamsJob(
            dbConnection,
            redisClient,
            runWorkerEmiiter,
            dataWorkerEmitter,
            streamWorkerEmitter,
            log,
          )
        }
      } catch (err) {
        log.error(err, 'Failed to process old streams/webhooks!')
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
