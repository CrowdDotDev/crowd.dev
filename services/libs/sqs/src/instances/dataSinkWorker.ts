import { Logger } from '@crowd/logging'
import { DATA_SINK_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import {
  CreateAndProcessActivityResultQueueMessage,
  IActivityData,
  IDataSinkWorkerEmitter,
  ProcessIntegrationResultQueueMessage,
} from '@crowd/types'

export class DataSinkWorkerEmitter extends SqsQueueEmitter implements IDataSinkWorkerEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, parentLog)
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
