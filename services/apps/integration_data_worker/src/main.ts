import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './config'
import { getRedisClient } from '@crowd/redis'
import { getDbConnection } from '@crowd/database'
import { getSqsClient } from '@crowd/sqs'
import { DataSinkWorkerEmitter, StreamWorkerEmitter, WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting integration data worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const streamWorkerEmitter = new StreamWorkerEmitter(sqsClient, log)
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(sqsClient, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    redisClient,
    dbConnection,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    log,
  )

  try {
    await streamWorkerEmitter.init()
    await dataSinkWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
  }
})
