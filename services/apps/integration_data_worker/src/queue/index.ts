import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  IntegrationStreamWorkerEmitter,
  DataSinkWorkerEmitter,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  IQueueMessage,
  IntegrationDataWorkerQueueMessageType,
  ProcessStreamDataQueueMessage,
} from '@crowd/types'
import IntegrationStreamService from '../service/integrationDataService'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
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
