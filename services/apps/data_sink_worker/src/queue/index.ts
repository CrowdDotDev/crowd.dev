import { DataSinkWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/common_services'
import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Logger } from '@crowd/logging'
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
import { performance } from 'perf_hooks'
import DataSinkService from '../service/dataSink.service'

export class WorkerQueueReceiver extends PrioritizedQueueReciever {
  private readonly timingMap = new Map<string, { count: number; time: number }>()

  constructor(
    level: QueuePriorityLevel,
    client: IQueue,
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
      20,
      parentLog,
      undefined,
      undefined,
      10,
    )
  }

  override async processMessage(message: IQueueMessage): Promise<void> {
    const startTime = performance.now()

    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new DataSinkService(
        new DbStore(this.log, this.pgConn, undefined, false),
        new DbStore(this.log, this.qdbConn, undefined, false),
        this.searchSyncWorkerEmitter,
        this.dataSinkWorkerEmitter,
        this.redisClient,
        this.temporal,
        this.log,
      )

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
        case DataSinkWorkerQueueMessageType.CHECK_RESULTS: {
          await service.checkResults()
          break
        }

        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
      throw err
    } finally {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.log.info({ msgType: message.type }, `Message processed in ${duration.toFixed(2)}ms!`)

      if (this.timingMap.has(message.type)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this.timingMap.get(message.type)!
        this.timingMap.set(message.type, { count: data.count + 1, time: data.time + duration })
      } else {
        this.timingMap.set(message.type, { count: 1, time: duration })
      }

      const data = this.timingMap.get(message.type)

      this.log.info(
        { msgType: message.type },
        `Average processing time: ${data.time / data.count}ms!`,
      )
    }
  }
}
