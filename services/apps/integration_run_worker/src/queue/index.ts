import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { ApiPubSubEmitter, RedisClient } from '@crowd/redis'
import {
  INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsPrioritizedQueueReciever,
} from '@crowd/sqs'
import { Span, SpanStatusCode, Tracer } from '@crowd/tracing'
import {
  GenerateRunStreamsQueueMessage,
  IQueueMessage,
  IntegrationRunWorkerQueueMessageType,
  QueuePriorityLevel,
  StartIntegrationRunQueueMessage,
  StreamProcessedQueueMessage,
} from '@crowd/types'
import IntegrationRunService from '../service/integrationRunService'

/* eslint-disable no-case-declarations */

export class WorkerQueueReceiver extends SqsPrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly integrationSyncWorkerEmitter: IntegrationSyncWorkerEmitter,
    private readonly apiPubSubEmitter: ApiPubSubEmitter,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      level,
      client,
      INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
      maxConcurrentProcessing,
      tracer,
      parentLog,
    )
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    await this.tracer.startActiveSpan('ProcessMessage', async (span: Span) => {
      try {
        this.log.trace({ messageType: message.type }, 'Processing message!')

        const service = new IntegrationRunService(
          this.redisClient,
          this.streamWorkerEmitter,
          this.runWorkerEmitter,
          this.searchSyncWorkerEmitter,
          this.integrationSyncWorkerEmitter,
          this.apiPubSubEmitter,
          new DbStore(this.log, this.dbConn),
          this.log,
        )

        switch (message.type) {
          case IntegrationRunWorkerQueueMessageType.CHECK_RUNS:
            await service.checkRuns()
            break
          case IntegrationRunWorkerQueueMessageType.START_INTEGRATION_RUN:
            const msg = message as StartIntegrationRunQueueMessage
            await service.startIntegrationRun(
              msg.integrationId,
              msg.onboarding,
              msg.isManualRun,
              msg.manualSettings,
            )
            break
          case IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS:
            const msg2 = message as GenerateRunStreamsQueueMessage
            await service.generateStreams(msg2.runId, msg2.isManualRun, msg2.manualSettings)
            break
          case IntegrationRunWorkerQueueMessageType.STREAM_PROCESSED:
            await service.handleStreamProcessed((message as StreamProcessedQueueMessage).runId)
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
