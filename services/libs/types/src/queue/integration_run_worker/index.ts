import { IQueueMessage } from '../'

export enum IntegrationRunWorkerQueueMessageType {
  START_INTEGRATION_RUN = 'start_integration_run',
  GENERATE_RUN_STREAMS = 'generate_run_streams',
  STREAM_PROCESSED = 'stream_processed',
}

export class StartIntegrationRunQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.START_INTEGRATION_RUN

  constructor(public readonly integrationId: string, public readonly onboarding: boolean) {}
}

export class GenerateRunStreamsQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS

  constructor(public readonly runId: string) {}
}

export class StreamProcessedQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.STREAM_PROCESSED

  constructor(public readonly runId: string) {}
}
