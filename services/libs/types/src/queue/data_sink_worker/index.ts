import { IActivityData } from '../../activities'
import { IQueueMessage } from '../'

export enum DataSinkWorkerQueueMessageType {
  PROCESS_INTEGRATION_RESULT = 'process_integration_result',
  CALCULATE_SENTIMENT = 'calculate_sentiment',
  CREATE_AND_PROCESS_ACTIVITY_RESULT = 'create_and_process_activity_result',
}

export class ProcessIntegrationResultQueueMessage implements IQueueMessage {
  public readonly type: string = DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT

  constructor(public readonly resultId: string) {}
}

export class CalculateSentimentQueueMessage implements IQueueMessage {
  public readonly type: string = DataSinkWorkerQueueMessageType.CALCULATE_SENTIMENT

  constructor(public readonly activityId: string) {}
}

export class CreateAndProcessActivityResultQueueMessage implements IQueueMessage {
  public readonly type: string = DataSinkWorkerQueueMessageType.CREATE_AND_PROCESS_ACTIVITY_RESULT

  constructor(
    public readonly tenantId: string,
    public readonly segmentId: string,
    public readonly integrationId: string,
    public readonly activityData: IActivityData,
  ) {}
}

export interface IDataSinkWorkerEmitter {
  triggerResultProcessing(
    tenantId: string,
    platform: string,
    resultId: string,
    sourceId: string,
  ): Promise<void>

  createAndProcessActivityResult(
    tenantId: string,
    segmentId: string,
    integrationId: string,
    activity: IActivityData,
  ): Promise<void>
}
