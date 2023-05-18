import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueSender,
} from '@crowd/sqs'
import {
  IQueueMessage,
  IntegrationDataWorkerQueueMessageType,
  ProcessStreamDataQueueMessage,
  ProcessStreamQueueMessage,
} from '@crowd/types'
import IntegrationStreamService from '../service/integrationDataService'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerSender: StreamWorkerSender,
    private readonly dataSinkWorkerSender: DataSinkWorkerSender,
    parentLog: Logger,
  ) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationStreamService(
        this.redisClient,
        this.streamWorkerSender,
        this.dataSinkWorkerSender,
        new DbStore(this.log, this.dbConn),
        this.log,
      )

      switch (message.type) {
        case IntegrationDataWorkerQueueMessageType.PROCESS_STREAM_DATA:
          await service.processData((message as ProcessStreamDataQueueMessage).dataId)
          break
        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
    }
  }
}

export class StreamWorkerSender extends SqsQueueSender {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerStreamProcessing(groupId: string, streamId: string) {
    await this.sendMessage(groupId, new ProcessStreamQueueMessage(streamId))
  }
}

export class DataSinkWorkerSender extends SqsQueueSender {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerResultProcessing(groupId: string, resultId: string) {
    await this.sendMessage(groupId, new ProcessIntegrationResultQueueMessage(resultId))
  }
}
