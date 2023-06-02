import { IQueueMessage } from '../'

export enum NodejsWorkerQueueMessageType {
  NODE_MICROSERVICE = 'node_microservice',
}

export class NewActivityAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly trigger = 'new_activity'
  public readonly service = 'automation'

  constructor(public readonly tenant: string, public readonly activityId: unknown) {}
}

export class NewMemberAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly trigger = 'new_member'
  public readonly service = 'automation'

  constructor(public readonly tenant: string, public readonly memberId: unknown) {}
}

export class LoadConversationIntoSearchEngineQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'search-engine-update'

  constructor(public readonly tenant: string, public readonly conversationId: string) {}
}
