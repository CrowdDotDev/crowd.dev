import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, SQS_CONFIG } from './conf'
import { DataSinkWorkerEmitter, WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())

  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(sqsClient, log)
  const queue = new WorkerQueueReceiver(sqsClient, dbConnection, dataSinkWorkerEmitter, log)

  try {
    await dataSinkWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
  }
})
