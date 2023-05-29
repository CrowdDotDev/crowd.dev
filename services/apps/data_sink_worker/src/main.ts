import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { NodejsWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, SENTIMENT_CONFIG, SQS_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'
import { initializeSentimentAnalysis } from '@crowd/sentiment'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG())

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, log)

  const queue = new WorkerQueueReceiver(sqsClient, dbConnection, nodejsWorkerEmitter, log)

  try {
    await nodejsWorkerEmitter.init()
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
