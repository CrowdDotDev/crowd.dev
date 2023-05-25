import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  DATA_SINK_WORKER_QUEUE_SETTINGS,
  NODEJS_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsQueueEmitter,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  DataSinkWorkerQueueMessageType,
  IQueueMessage,
  NewActivityAutomationQueueMessage,
  NewMemberAutomationQueueMessage,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'
import DataSinkService from '../service/dataSink.service'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    parentLog: Logger,
  ) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, 2, parentLog)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new DataSinkService(
        new DbStore(this.log, this.dbConn),
        this.nodejsWorkerEmitter,
        this.log,
      )

      switch (message.type) {
        case DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT:
          await service.processResult((message as ProcessIntegrationResultQueueMessage).resultId)
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

export class NodejsWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, NODEJS_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
  ): Promise<void> {
    await this.sendMessage(tenantId, new NewActivityAutomationQueueMessage(tenantId, activityId))
  }

  public async processAutomationForNewMember(tenantId: string, memberId: string): Promise<void> {
    await this.sendMessage(tenantId, new NewMemberAutomationQueueMessage(tenantId, memberId))
  }
}

export class DataSinkWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, parentLog)
  }
}
