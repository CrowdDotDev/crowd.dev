import { timeout } from '@crowd/common'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  IQueueMessage,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueSender,
} from '@crowd/sqs'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    this.log.info({ message }, 'Processing message!')
    await timeout(2000)
    this.log.info({ message }, 'Finished processing message!')
  }
}

export class StreamWorkerSender extends SqsQueueSender {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, parentLog)
  }
}
