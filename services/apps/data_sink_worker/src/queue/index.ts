import { APP_IOC } from '../ioc_constants'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { DATA_SINK_WORKER_QUEUE_SETTINGS, SQS_IOC, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import {
  CreateAndProcessActivityResultQueueMessage,
  DataSinkWorkerQueueMessageType,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'
import { inject, injectable } from 'inversify'
import DataSinkService from '../service/dataSink.service'
import { IOC, childIocContainer } from '@crowd/ioc'

@injectable()
export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    @inject(SQS_IOC.client)
    client: SqsClient,
    @inject(LOGGING_IOC.logger)
    parentLog: Logger,
    @inject(APP_IOC.maxConcurrentProcessing)
    maxConcurrentProcessing: number,
  ) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)

    // just a test of resolution
    IOC().get<DataSinkService>(APP_IOC.dataSinkService)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const requestContainer = childIocContainer()
      const childLogger = getChildLogger('message-processing', this.log, {
        messageType: message.type,
      })

      requestContainer.bind(LOGGING_IOC.logger).toConstantValue(childLogger)
      const service = requestContainer.get<DataSinkService>(APP_IOC.dataSinkService)

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
