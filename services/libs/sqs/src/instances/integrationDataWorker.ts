import { Logger } from '@crowd/logging'
import { INTEGRATION_DATA_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { IIntegrationDataWorkerEmitter, ProcessStreamDataQueueMessage } from '@crowd/types'

export class IntegrationDataWorkerEmitter
  extends SqsQueueEmitter
  implements IIntegrationDataWorkerEmitter
{
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerDataProcessing(tenantId: string, platform: string, dataId: string) {
    await this.sendMessage(dataId, new ProcessStreamDataQueueMessage(dataId), dataId)
  }
}
