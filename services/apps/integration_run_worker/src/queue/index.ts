import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { ApiPubSubEmitter, RedisClient } from '@crowd/redis'
import {
  INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  IntegrationStreamWorkerEmitter,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  GenerateRunStreamsRunQueueMessage,
  IQueueMessage,
  IntegrationRunWorkerQueueMessageType,
  StreamProcessedQueueMessage,
} from '@crowd/types'
import IntegrationRunService from '../service/integrationRunService'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly apiPubSubEmitter: ApiPubSubEmitter,
    parentLog: Logger,
  ) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new IntegrationRunService(
        this.redisClient,
        this.streamWorkerEmitter,
        this.apiPubSubEmitter,
        new DbStore(this.log, this.dbConn),
        this.log,
      )

      switch (message.type) {
        case IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS:
          await service.generateStreams((message as GenerateRunStreamsRunQueueMessage).runId)
          break
        case IntegrationRunWorkerQueueMessageType.STREAM_PROCESSED:
          await service.handleStreamProcessed((message as StreamProcessedQueueMessage).runId)
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
