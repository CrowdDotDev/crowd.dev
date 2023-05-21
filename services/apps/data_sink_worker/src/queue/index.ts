import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueEmitter,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  CalculateSentimentQueueMessage,
  DataSinkWorkerQueueMessageType,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'
import DataSinkService from '../service/dataSink.service'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    parentLog: Logger,
  ) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new DataSinkService(
        new DbStore(this.log, this.dbConn),
        this.dataSinkWorkerEmitter,
        this.log,
      )

      switch (message.type) {
        case DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT:
          await service.processResult((message as ProcessIntegrationResultQueueMessage).resultId)
          break
        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
    }
  }
}

export class DataSinkWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async calculateSentiment(
    tenantId: string,
    platform: string,
    activityId: string,
  ): Promise<void> {
    await this.sendMessage(groupId, new CalculateSentimentQueueMessage(activityId))
  }
}
