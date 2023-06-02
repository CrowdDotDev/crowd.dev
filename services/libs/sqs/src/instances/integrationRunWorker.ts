import { Logger } from '@crowd/logging'
import { INTEGRATION_RUN_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import {
  StreamProcessedQueueMessage,
  GenerateRunStreamsQueueMessage,
  StartIntegrationRunQueueMessage,
  CheckRunsQueueMessage,
} from '@crowd/types'

export class IntegrationRunWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async checkRuns(tenantId: string) {
    await this.sendMessage(`runs-${tenantId}`, new CheckRunsQueueMessage())
  }

  public async triggerIntegrationRun(
    tenantId: string,
    platform: string,
    integrationId: string,
    onboarding: boolean,
  ): Promise<void> {
    await this.sendMessage(
      `${tenantId}-${platform}`,
      new StartIntegrationRunQueueMessage(integrationId, onboarding),
    )
  }

  public async triggerRunProcessing(
    tenantId: string,
    platform: string,
    runId: string,
  ): Promise<void> {
    await this.sendMessage(`${tenantId}-${platform}`, new GenerateRunStreamsQueueMessage(runId))
  }

  public async streamProcessed(tenantId: string, platform: string, runId: string): Promise<void> {
    await this.sendMessage(`runs-${tenantId}-${platform}`, new StreamProcessedQueueMessage(runId))
  }
}
