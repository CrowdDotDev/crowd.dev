import { Logger } from '@crowd/logging'
import { DATA_SINK_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import {
  CreateAndProcessActivityResultQueueMessage,
  IActivityData,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'
import { Tracer } from '@crowd/tracing'

export class DataSinkWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, tracer: Tracer, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, tracer, parentLog)
  }

  public async triggerResultProcessing(
    tenantId: string,
    platform: string,
    resultId: string,
    sourceId: string,
  ) {
    await this.sendMessage(sourceId, new ProcessIntegrationResultQueueMessage(resultId), resultId)
  }

  public async createAndProcessActivityResult(
    tenantId: string,
    segmentId: string,
    integrationId: string,
    activity: IActivityData,
  ) {
    await this.sendMessage(
      new Date().toISOString(),
      new CreateAndProcessActivityResultQueueMessage(tenantId, segmentId, integrationId, activity),
    )
  }
}
