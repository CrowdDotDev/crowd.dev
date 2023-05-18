import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, SQS_CONFIG } from './config'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())

  const queue = new WorkerQueueReceiver(sqsClient, dbConnection, log)

  try {
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
  }
})
