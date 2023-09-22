import { Logger } from '@crowd/logging'
import { INTEGRATION_DATA_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { ProcessStreamDataQueueMessage } from '@crowd/types'
import { Tracer } from '@opentelemetry/api'

export class IntegrationDataWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, tracer: Tracer, parentLog: Logger) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, tracer, parentLog)
  }

  public async triggerDataProcessing(tenantId: string, platform: string, dataId: string) {
    await this.sendMessage(dataId, new ProcessStreamDataQueueMessage(dataId), dataId)
  }
}
