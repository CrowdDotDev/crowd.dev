import { getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'
import { ApiPubSubEmitter, getRedisClient } from '@crowd/redis'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting integration run worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const runWorkerEmitter = new IntegrationRunWorkerEmitter(sqsClient, tracer, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, tracer, log)
  const integrationSyncWorkerEmitter = new IntegrationSyncWorkerEmitter(sqsClient, tracer, log)

  const apiPubSubEmitter = new ApiPubSubEmitter(redisClient, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    redisClient,
    dbConnection,
    streamWorkerEmitter,
    runWorkerEmitter,
    integrationSyncWorkerEmitter,
    apiPubSubEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await streamWorkerEmitter.init()
    await runWorkerEmitter.init()
    await integrationSyncWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
