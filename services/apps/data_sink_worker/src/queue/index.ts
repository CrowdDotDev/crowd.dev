import { DbConnection, DbStore } from '@crowd/database'
import { Tracer } from '@crowd/tracing'
import { Logger } from '@crowd/logging'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
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

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly redisClient: RedisClient,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, tracer, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new DataSinkService(
        new DbStore(this.log, this.dbConn),
        this.nodejsWorkerEmitter,
        this.searchSyncWorkerEmitter,
        this.redisClient,
        this.log,
      )

      switch (message.type) {
        case DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT:
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

        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
      throw err
    }
  }
}
