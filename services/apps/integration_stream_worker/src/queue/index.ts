import { APP_IOC } from '../ioc_constants'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import {
  INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  SQS_IOC,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  ContinueProcessingRunStreamsQueueMessage,
  IQueueMessage,
  IntegrationStreamWorkerQueueMessageType,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
} from '@crowd/types'
import { inject, injectable } from 'inversify'
import IntegrationStreamService from '../service/integrationStreamService'
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
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)

    IOC().get<IntegrationStreamService>(APP_IOC.streamService)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const requestContainer = childIocContainer()
      const childLogger = getChildLogger('message-processing', this.log, {
        messageType: message.type,
      })

      requestContainer.bind(LOGGING_IOC.logger).toConstantValue(childLogger)
      const service = requestContainer.get<IntegrationStreamService>(APP_IOC.streamService)

      switch (message.type) {
        case IntegrationStreamWorkerQueueMessageType.CHECK_STREAMS:
          await service.checkStreams()
          break
        case IntegrationStreamWorkerQueueMessageType.CONTINUE_PROCESSING_RUN_STREAMS:
          await service.continueProcessingRunStreams(
            (message as ContinueProcessingRunStreamsQueueMessage).runId,
          )
          break
        case IntegrationStreamWorkerQueueMessageType.PROCESS_STREAM:
          await service.processStream((message as ProcessStreamQueueMessage).streamId)
          break
        case IntegrationStreamWorkerQueueMessageType.PROCESS_WEBHOOK_STREAM:
          await service.processWebhookStream(
            (message as ProcessWebhookStreamQueueMessage).webhookId,
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
