import { IQueueMessage } from '../'

export enum NodejsWorkerQueueMessageType {
  NODE_MICROSERVICE = 'node_microservice',
}

export class NewActivityAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly trigger = 'new_activity'
  public readonly service = 'automation'

  constructor(
    public readonly tenant: string,
    public readonly activityId: string,
    public readonly segmentId: string,
  ) {}
}

export class NewMemberAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly trigger = 'new_member'
  public readonly service = 'automation'

  constructor(public readonly tenant: string, public readonly memberId: string) {}
}

export class EnrichMemberOrganizationsQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'enrich_member_organizations'

  constructor(
    public readonly tenant: string,
    public readonly memberId: string,
    public readonly organizationIds: string[],
  ) {}
}
