import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueReceiver,
  SqsQueueSender,
} from '@crowd/sqs'
import {
  GenerateRunStreamsRunQueueMessage,
  IQueueMessage,
  IntegrationRunWorkerQueueMessageType,
  ProcessStreamQueueMessage,
} from '@crowd/types'
import IntegrationRunService from '../service/integrationRunService'
import { RedisClient } from '@crowd/redis'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerSender: StreamWorkerSender,
    parentLog: Logger,
  ) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationRunService(
        this.redisClient,
        this.streamWorkerSender,
        new DbStore(this.log, this.dbConn),
        this.log,
      )

      switch (message.type) {
        case IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS:
          await service.generateStreams((message as GenerateRunStreamsRunQueueMessage).runId)
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
