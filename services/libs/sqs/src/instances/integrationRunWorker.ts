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
import { Tracer } from '@opentelemetry/api'

export class IntegrationRunWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, tracer: Tracer, parentLog: Logger) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, tracer, parentLog)
  }

  public async checkRuns() {
    await this.sendMessage('global', new CheckRunsQueueMessage())
  }

  public async triggerIntegrationRun(
    tenantId: string,
    platform: string,
    integrationId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      integrationId,
      new StartIntegrationRunQueueMessage(integrationId, onboarding, isManualRun, manualSettings),
    )
  }

  public async triggerRunProcessing(
    tenantId: string,
    platform: string,
    runId: string,
    isManualRun?: boolean,
    manualSettings?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      runId,
      new GenerateRunStreamsQueueMessage(runId, isManualRun, manualSettings),
      runId,
    )
  }

  public async streamProcessed(tenantId: string, platform: string, runId: string): Promise<void> {
    await this.sendMessage(runId, new StreamProcessedQueueMessage(runId))
  }
}
