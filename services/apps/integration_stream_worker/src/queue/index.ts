import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  IntegrationRunWorkerEmitter,
  IntegrationDataWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  ContinueProcessingRunStreamsQueueMessage,
  IQueueMessage,
  IntegrationStreamWorkerQueueMessageType,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
} from '@crowd/types'
import { RedisClient } from '@crowd/redis'
import IntegrationStreamService from '../service/integrationStreamService'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly dataWorkerEmitter: IntegrationDataWorkerEmitter,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationStreamService(
        this.redisClient,
        this.runWorkerEmitter,
        this.dataWorkerEmitter,
        this.streamWorkerEmitter,
        new DbStore(this.log, this.dbConn),
        this.log,
      )

      switch (message.type) {
        case IntegrationStreamWorkerQueueMessageType.CHECK_STREAMS:
          await service.checkStreams()
          break
        case IntegrationStreamWorkerQueueMessageType.CONTINUE_PROCESSING_RUN_STREAMS:
          await service.continueProcessingRunStreams(
            (message as ContinueProcessingRunStreamsQueueMessage).runId,
          )
          break
        case IntegrationStreamWorkerQueueMessageType.PROCESS_STREAM:
          await service.processStream((message as ProcessStreamQueueMessage).streamId)
          break
        case IntegrationStreamWorkerQueueMessageType.PROCESS_WEBHOOK_STREAM:
          await service.processWebhookStream((message as ProcessWebhookStreamQueueMessage).streamId)
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
