import { Tracer, Span, SpanStatusCode } from '@crowd/tracing'
import { Logger } from '@crowd/logging'
import { DbConnection, DbStore } from '@crowd/database'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
  DataSinkWorkerEmitter,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  CreateAndProcessActivityResultQueueMessage,
  DataSinkWorkerQueueMessageType,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'
import DataSinkService from '../service/dataSink.service'
import { RedisClient } from '@crowd/redis'
import { Unleash } from '@crowd/feature-flags'
import { Client as TemporalClient } from '@crowd/temporal'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly unleash: Unleash | undefined,
    private readonly temporal: TemporalClient,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, tracer, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    await this.tracer.startActiveSpan('ProcessMessage', async (span: Span) => {
      try {
        this.log.trace({ messageType: message.type }, 'Processing message!')

        const service = new DataSinkService(
          new DbStore(this.log, this.dbConn, undefined, false),
          this.nodejsWorkerEmitter,
          this.searchSyncWorkerEmitter,
          this.dataSinkWorkerEmitter,
          this.redisClient,
          this.unleash,
          this.temporal,
          this.log,
        )

        switch (message.type) {
          case DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT:
            // this type of message will be processed by the processOldResultsJob
            await service.processResult((message as ProcessIntegrationResultQueueMessage).resultId)
            break
          case DataSinkWorkerQueueMessageType.CREATE_AND_PROCESS_ACTIVITY_RESULT: {
            const msg = message as CreateAndProcessActivityResultQueueMessage
            await service.createAndProcessActivityResult(
              msg.tenantId,
              msg.segmentId,
              msg.integrationId,
              msg.activityData,
            )
            break
          }
          case DataSinkWorkerQueueMessageType.CHECK_RESULTS: {
            await service.checkResults()
            break
          }

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
