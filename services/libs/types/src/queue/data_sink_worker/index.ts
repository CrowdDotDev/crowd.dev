import { IQueueMessage } from '../'

export enum DataSinkWorkerQueueMessageType {
  PROCESS_INTEGRATION_RESULT = 'process_integration_result',
  CALCULATE_SENTIMENT = 'calculate_sentiment',
}

export class ProcessIntegrationResultQueueMessage implements IQueueMessage {
  public readonly type: string = DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT

  constructor(public readonly resultId: string) {}
}

export class CalculateSentimentQueueMessage implements IQueueMessage {
  public readonly type: string = DataSinkWorkerQueueMessageType.CALCULATE_SENTIMENT

  constructor(public readonly activityId: string) {}
}
