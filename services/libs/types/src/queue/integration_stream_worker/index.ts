import { IQueueMessage } from '../'

export enum IntegrationStreamWorkerQueueMessageType {
  CHECK_STREAMS = 'check_streams',
  CONTINUE_PROCESSING_RUN_STREAMS = 'continue_processing_run_streams',
  PROCESS_STREAM = 'process_stream',
}

export class CheckStreamsQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationStreamWorkerQueueMessageType.CHECK_STREAMS
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
