import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './config'
import { getRedisClient } from '@crowd/redis'
import { getDbConnection } from '@crowd/database'
import { getSqsClient } from '@crowd/sqs'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting integration stream worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const queue = new WorkerQueueReceiver(sqsClient, redisClient, dbConnection, log)

  try {
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
  }
})
