import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './config'
import { WorkerQueueReceiver } from './queue'
import { ApiPubSubEmitter, getRedisClient } from '@crowd/redis'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting integration run worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, log)

  const apiPubSubEmitter = new ApiPubSubEmitter(redisClient, log)

  const queue = new WorkerQueueReceiver(
    sqsClient,
    redisClient,
    dbConnection,
    streamWorkerEmitter,
    apiPubSubEmitter,
    log,
  )

  try {
    await streamWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
