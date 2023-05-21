import { IQueueMessage } from '../'

export enum NodejsWorkerQueueMessageType {
  PROCESS_ACTIVITY_CONVERSATIONS = 'process_activity_conversations',
}

export class ProcessActivityConversationsQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.CALCULATE_SENTIMENT

  constructor(public readonly activityId: string) {}
}
