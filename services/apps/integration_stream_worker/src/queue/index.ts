import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'
import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsPrioritizedQueueReciever,
} from '@crowd/sqs'
import {
  ContinueProcessingRunStreamsQueueMessage,
  IQueueMessage,
  IntegrationStreamWorkerQueueMessageType,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'
import IntegrationStreamService from '../service/integrationStreamService'

export class WorkerQueueReceiver extends SqsPrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly dataWorkerEmitter: IntegrationDataWorkerEmitter,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      level,
      client,
      INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
      maxConcurrentProcessing,
      parentLog,
    )
  }

  override async processMessage(message: IQueueMessage, receiptHandle: string): Promise<void> {
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
          await service.processStream(
            (message as ProcessStreamQueueMessage).streamId,
            receiptHandle,
          )
          break
        case IntegrationStreamWorkerQueueMessageType.PROCESS_WEBHOOK_STREAM:
          await service.processWebhookStream(
            (message as ProcessWebhookStreamQueueMessage).webhookId,
          )
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
