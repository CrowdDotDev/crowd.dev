import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueEmitter,
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
    private readonly dataWorkerEmitter: DataWorkerEmitter,
    private readonly streamWorkerEmitter: StreamWorkerEmitter,
    parentLog: Logger,
  ) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationStreamService(
        this.redisClient,
        this.dataWorkerEmitter,
        this.streamWorkerEmitter,
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
      throw err
    }
  }
}

export class DataWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerDataProcessing(tenantId: string, platform: string, dataId: string) {
    await this.sendMessage(
      `data-${tenantId}-${platform}`,
      new ProcessStreamDataQueueMessage(dataId),
    )
  }
}

export class StreamWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerStreamProcessing(tenantId: string, platform: string, streamId: string) {
    await this.sendMessage(
      `streams-${tenantId}-${platform}`,
      new ProcessStreamQueueMessage(streamId),
    )
  }
}
