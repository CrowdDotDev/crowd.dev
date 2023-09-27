import { APP_IOC } from '../ioc_constants'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import {
  INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
  SQS_IOC,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  IQueueMessage,
  IntegrationDataWorkerQueueMessageType,
  ProcessStreamDataQueueMessage,
} from '@crowd/types'
import { inject, injectable } from 'inversify'
import { default as IntegrationDataService } from '../service/integrationDataService'
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
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)

    // just a test of resolution
    IOC().get<IntegrationDataService>(APP_IOC.dataService)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const requestContainer = childIocContainer()
      const childLogger = getChildLogger('message-processing', this.log, {
        messageType: message.type,
      })

      requestContainer.bind(LOGGING_IOC.logger).toConstantValue(childLogger)
      const service = requestContainer.get<IntegrationDataService>(APP_IOC.dataService)

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
