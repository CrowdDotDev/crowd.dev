import { IQueueMessage } from '../'

export enum IntegrationStreamWorkerQueueMessageType {
  CONTINUE_PROCESSING_RUN_STREAMS = 'continue_processing_run_streams',
  PROCESS_STREAM = 'process_stream',
}

export class ContinueProcessingRunStreamsQueueMessage implements IQueueMessage {
  public readonly type: string =
    IntegrationStreamWorkerQueueMessageType.CONTINUE_PROCESSING_RUN_STREAMS

  constructor(public readonly runId: string) {}
}

export class ProcessStreamQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationStreamWorkerQueueMessageType.PROCESS_STREAM

  constructor(public readonly streamId: string) {}
}
