import { IQueueMessage } from '../'

export enum IntegrationRunWorkerQueueMessageType {
  GENERATE_RUN_STREAMS = 'generate_run_streams',
}

export class GenerateRunStreamsRunQueueMessage implements IQueueMessage {
  public readonly type: string = IntegrationRunWorkerQueueMessageType.GENERATE_RUN_STREAMS

  constructor(public readonly runId: string) {}
}
