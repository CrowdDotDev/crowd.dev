import { IQueueMessage } from '../'

export enum IntegrationRunWorkerQueueMessageType {
  START_INTEGRATION_RUN = 'start_integration_run',
  GENERATE_RUN_STREAMS = 'generate_run_streams',
  STREAM_PROCESSED = 'stream_processed',
  CHECK_RUNS = 'check_runs',
}

export class CheckRunsQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.CHECK_RUNS
}

export class StartIntegrationRunQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.START_INTEGRATION_RUN

  constructor(
    public readonly integrationId: string,
    public readonly onboarding: boolean,
    public readonly isManualRun?: boolean,
    public readonly manualSettings?: unknown,
  ) {}
}

export class GenerateRunStreamsQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS

  constructor(
    public readonly runId: string,
    public readonly isManualRun?: boolean,
    public readonly manualSettings?: unknown,
  ) {}
}

export class StreamProcessedQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.STREAM_PROCESSED

  constructor(public readonly runId: string) {}
}

export interface IIntegrationRunWorkerEmitter {
  checkRuns(): Promise<void>
  triggerIntegrationRun(
    tenantId: string,
    platform: string,
    integrationId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
  ): Promise<void>
  triggerRunProcessing(
    tenantId: string,
    platform: string,
    runId: string,
    isManualRun?: boolean,
    manualSettings?: unknown,
  ): Promise<void>
  streamProcessed(tenantId: string, platform: string, runId: string): Promise<void>
}
