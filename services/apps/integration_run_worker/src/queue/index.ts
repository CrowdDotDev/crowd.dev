import { APP_IOC } from '../ioc_constants'
import IntegrationRunService from '../service/integrationRunService'
import { IOC, childIocContainer } from '@crowd/ioc'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import {
  INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  SQS_IOC,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  GenerateRunStreamsQueueMessage,
  IQueueMessage,
  IntegrationRunWorkerQueueMessageType,
  StartIntegrationRunQueueMessage,
  StreamProcessedQueueMessage,
} from '@crowd/types'
import { inject, injectable } from 'inversify'

/* eslint-disable no-case-declarations */

@injectable()
export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    @inject(SQS_IOC.client) client: SqsClient,
    @inject(LOGGING_IOC.logger) parentLog: Logger,
    @inject(APP_IOC.maxConcurrentProcessing) maxConcurrentProcessing: number,
  ) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)

    // just a test of resolution
    IOC().get<IntegrationRunService>(APP_IOC.runService)
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const requestContainer = childIocContainer()
      const childLogger = getChildLogger('message-processing', this.log, {
        messageType: message.type,
      })

      requestContainer.bind(LOGGING_IOC.logger).toConstantValue(childLogger)
      const service = requestContainer.get<IntegrationRunService>(APP_IOC.runService)

      switch (message.type) {
        case IntegrationRunWorkerQueueMessageType.CHECK_RUNS: {
          await service.checkRuns()
          break
        }

        case IntegrationRunWorkerQueueMessageType.START_INTEGRATION_RUN: {
          const msg = message as StartIntegrationRunQueueMessage
          await service.startIntegrationRun(
            msg.integrationId,
            msg.onboarding,
            msg.isManualRun,
            msg.manualSettings,
          )
          break
        }

        case IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS: {
          const msg = message as GenerateRunStreamsQueueMessage
          await service.generateStreams(msg.runId, msg.isManualRun, msg.manualSettings)
          break
        }

        case IntegrationRunWorkerQueueMessageType.STREAM_PROCESSED: {
          await service.handleStreamProcessed((message as StreamProcessedQueueMessage).runId)
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
