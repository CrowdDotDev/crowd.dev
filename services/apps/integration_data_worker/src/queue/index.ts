import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsPrioritizedQueueReciever,
} from '@crowd/sqs'
import { Span, SpanStatusCode, Tracer } from '@crowd/tracing'
import {
  IQueueMessage,
  IntegrationDataWorkerQueueMessageType,
  ProcessStreamDataQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'
import IntegrationStreamService from '../service/integrationDataService'
import { DataSinkWorkerEmitter, IntegrationStreamWorkerEmitter } from '@crowd/common_services'

export class WorkerQueueReceiver extends SqsPrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      level,
      client,
      INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
      maxConcurrentProcessing,
      tracer,
      parentLog,
    )
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    await this.tracer.startActiveSpan('ProcessMessage', async (span: Span) => {
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
