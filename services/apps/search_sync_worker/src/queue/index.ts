import { DbConnection } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import { IQueueMessage } from '@crowd/types'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)
  }

  protected override async processMessage(data: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: data.type }, 'Processing message!')
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
      throw err
    }
  }
}
