import { DataSinkWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/common_services'
import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Logger, getChildLogger, logExecutionTimeV2 } from '@crowd/logging'
import { CrowdQueue, IQueue, PrioritizedQueueReciever } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import {
  CreateAndProcessActivityResultQueueMessage,
  DataSinkWorkerQueueMessageType,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'

import DataSinkService from '../service/dataSink.service'

export class WorkerQueueReceiver extends PrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    private readonly client: IQueue,
    private readonly pgConn: DbConnection,
    private readonly qdbConn: DbConnection,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly temporal: TemporalClient,
    parentLog: Logger,
  ) {
    super(
      level,
      client,
      client.getQueueChannelConfig(CrowdQueue.DATA_SINK_WORKER),
      Number(process.env.WORKER_MAX_CONCURRENCY || 1),
      parentLog,
      undefined,
      undefined,
      10,
    )
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      switch (message.type) {
        case DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT: {
          const resultId = (message as ProcessIntegrationResultQueueMessage).resultId
          const logger = getChildLogger('processIntegrationResult', this.log, { resultId })
          const service = new DataSinkService(
            new DbStore(logger, this.pgConn, undefined, false),
            new DbStore(logger, this.qdbConn, undefined, false),
            this.searchSyncWorkerEmitter,
            this.dataSinkWorkerEmitter,
            this.redisClient,
            this.temporal,
            this.client,
            logger,
          )

          await logExecutionTimeV2(() => service.processResult(resultId), logger, 'processResult')
          break
        }

        case DataSinkWorkerQueueMessageType.CREATE_AND_PROCESS_ACTIVITY_RESULT: {
          const msg = message as CreateAndProcessActivityResultQueueMessage
          const service = new DataSinkService(
            new DbStore(this.log, this.pgConn, undefined, false),
            new DbStore(this.log, this.qdbConn, undefined, false),
            this.searchSyncWorkerEmitter,
            this.dataSinkWorkerEmitter,
            this.redisClient,
            this.temporal,
            this.client,
            this.log,
          )
          await logExecutionTimeV2(
            () =>
              service.processActivityInMemoryResult(
                msg.segmentId,
                msg.integrationId,
                msg.activityData,
              ),
            this.log,
            'processActivityInMemoryResult',
          )
          break
        }
        case DataSinkWorkerQueueMessageType.CHECK_RESULTS: {
          const service = new DataSinkService(
            new DbStore(this.log, this.pgConn, undefined, false),
            new DbStore(this.log, this.qdbConn, undefined, false),
            this.searchSyncWorkerEmitter,
            this.dataSinkWorkerEmitter,
            this.redisClient,
            this.temporal,
            this.client,
            this.log,
          )
          await service.checkResults()
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
