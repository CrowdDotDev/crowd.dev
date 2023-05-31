import { IQueueMessage } from '../'

export enum IntegrationStreamWorkerQueueMessageType {
  PROCESS_STREAM = 'process_stream',
}

export class ProcessStreamQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationStreamWorkerQueueMessageType.PROCESS_STREAM

  constructor(public readonly streamId: string) {}
}
