import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueSender,
} from '@crowd/sqs'
import {
  IQueueMessage,
  IntegrationStreamWorkerQueueMessageType,
  ProcessStreamQueueMessage,
  ProcessStreamDataQueueMessage,
} from '@crowd/types'
import { RedisClient } from '@crowd/redis'
import IntegrationStreamService from '../service/integrationStreamService'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly dataWorkerSender: DataWorkerSender,
    private readonly streamWorkerSender: StreamWorkerSender,
    parentLog: Logger,
  ) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationStreamService(
        this.redisClient,
        this.dataWorkerSender,
        this.streamWorkerSender,
        new DbStore(this.log, this.dbConn),
        this.log,
      )

      switch (message.type) {
        case IntegrationStreamWorkerQueueMessageType.PROCESS_STREAM:
          await service.processStream((message as ProcessStreamQueueMessage).streamId)
          break
        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
    }
  }
}

export class DataWorkerSender extends SqsQueueSender {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerDataProcessing(groupId: string, dataId: string) {
    await this.sendMessage(groupId, new ProcessStreamDataQueueMessage(dataId))
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
