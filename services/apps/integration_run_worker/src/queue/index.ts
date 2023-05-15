import { DbConnection } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueSender,
} from '@crowd/sqs'
import { IQueueMessage } from '@crowd/types'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(client: SqsClient, private readonly dbConn: DbConnection, parentLog: Logger) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    this.log.trace({ messageType: message.type }, 'Processing message!')
  }
}

export class StreamWorkerSender extends SqsQueueSender {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, parentLog)
  }
}
