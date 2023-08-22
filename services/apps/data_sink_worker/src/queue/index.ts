import { DbConnection, DbStore } from '@crowd/database'
import { Logger, logExecutionTime } from '@crowd/logging'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  DataSinkWorkerQueueMessageType,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'
import DataSinkService from '../service/dataSink.service'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog, true)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new DataSinkService(
        new DbStore(this.log, this.dbConn),
        this.nodejsWorkerEmitter,
        this.searchSyncWorkerEmitter,
        this.log,
      )

      switch (message.type) {
        case DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT:
          await logExecutionTime(
            () => service.processResult((message as ProcessIntegrationResultQueueMessage).resultId),
            this.log,
            'dataSinkService.processResult',
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
