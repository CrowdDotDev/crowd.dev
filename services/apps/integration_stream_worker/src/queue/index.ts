import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'
import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  CrowdQueue,
  IQueue,
  PrioritizedQueueReciever,
} from '@crowd/queue'
import { Span, SpanStatusCode, Tracer } from '@crowd/tracing'
import {
  ContinueProcessingRunStreamsQueueMessage,
  IQueueMessage,
  IntegrationStreamWorkerQueueMessageType,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'
import IntegrationStreamService from '../service/integrationStreamService'

export class WorkerQueueReceiver extends PrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    client: IQueue,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      level,
      client,
      client.getQueueConfig(CrowdQueue.INTEGRATION_STREAM_WORKER),
      maxConcurrentProcessing,
      tracer,
      parentLog,
    )
  }

  override async processMessage(message: IQueueMessage, receiptHandle: string): Promise<void> {
    await this.tracer.startActiveSpan('ProcessMessage', async (span: Span) => {
      try {
        this.log.trace({ messageType: message.type }, 'Processing message!')

        const service = new IntegrationStreamService(
          this.redisClient,
          this.runWorkerEmitter,
          this.streamWorkerEmitter,
          this.dataSinkWorkerEmitter,
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

        span.setStatus({
          code: SpanStatusCode.OK,
        })
      } catch (err) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err,
        })

        this.log.error(err, 'Error while processing message!')
        throw err
      } finally {
        span.end()
      }
    })
  }
}
