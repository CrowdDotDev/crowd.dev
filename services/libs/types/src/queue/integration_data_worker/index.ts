import { IQueueMessage, ISqsQueueEmitter } from '../'

export enum IntegrationDataWorkerQueueMessageType {
  PROCESS_STREAM_DATA = 'process_stream_data',
}

export class ProcessStreamDataQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationDataWorkerQueueMessageType.PROCESS_STREAM_DATA

  constructor(public readonly dataId: string) {}
}

export interface IIntegrationDataWorkerEmitter extends ISqsQueueEmitter {
  triggerDataProcessing(tenantId: string, platform: string, dataId: string): Promise<void>
}
