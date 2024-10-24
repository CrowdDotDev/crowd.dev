import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue, PrioritizedQueueReciever } from '@crowd/queue'
import { ApiPubSubEmitter, RedisClient } from '@crowd/redis'
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

export class WorkerQueueReceiver extends PrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    client: IQueue,
    private readonly redisClient: RedisClient,
    private readonly dbConn: DbConnection,
    private readonly streamWorkerEmitter: IntegrationStreamWorkerEmitter,
    private readonly runWorkerEmitter: IntegrationRunWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly integrationSyncWorkerEmitter: IntegrationSyncWorkerEmitter,
    private readonly apiPubSubEmitter: ApiPubSubEmitter,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      level,
      client,
      client.getQueueChannelConfig(CrowdQueue.INTEGRATION_RUN_WORKER),
      maxConcurrentProcessing,
      parentLog,
    )
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
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
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
      throw err
    }
  }
}
