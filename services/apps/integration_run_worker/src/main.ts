import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './config'
import { StreamWorkerEmitter, WorkerQueueReceiver } from './queue'
import { getRedisClient } from '@crowd/redis'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting integration run worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const streamWorkerEmitter = new StreamWorkerEmitter(sqsClient, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    redisClient,
    dbConnection,
    streamWorkerEmitter,
    log,
  )

  try {
    await streamWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
  }
})
