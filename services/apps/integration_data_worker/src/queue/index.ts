import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueEmitter,
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
    private readonly streamWorkerEmitter: StreamWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    parentLog: Logger,
  ) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationStreamService(
        this.redisClient,
        this.streamWorkerEmitter,
        this.dataSinkWorkerEmitter,
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
      throw err
    }
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

export class DataSinkWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerResultProcessing(tenantId: string, platform: string, resultId: string) {
    await this.sendMessage(
      `results-${tenantId}-${platform}`,
      new ProcessIntegrationResultQueueMessage(resultId),
    )
  }
}
