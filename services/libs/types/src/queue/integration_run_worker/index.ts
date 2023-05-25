import { IQueueMessage } from '../'

export enum IntegrationRunWorkerQueueMessageType {
  GENERATE_RUN_STREAMS = 'generate_run_streams',
  STREAM_PROCESSED = 'stream_processed',
}

export class GenerateRunStreamsRunQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS

  constructor(public readonly runId: string) {}
}

export class StreamProcessedQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.STREAM_PROCESSED

  constructor(public readonly runId: string) {}
}
