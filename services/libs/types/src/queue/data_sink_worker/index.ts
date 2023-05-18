import { IQueueMessage } from '../'

export enum DataSinkWorkerQueueMessageType {
  PROCESS_INTEGRATION_RESULT = 'process_integration_result',
}

export class ProcessIntegrationResultQueueMessage implements IQueueMessage {
  public readonly type: string = DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT

  constructor(public readonly resultId: string) {}
}
