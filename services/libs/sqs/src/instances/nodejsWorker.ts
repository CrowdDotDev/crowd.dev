import { Logger } from '@crowd/logging'
import { NODEJS_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import {
  EnrichMemberOrganizationsQueueMessage,
  IQueueMessage,
  NewActivityAutomationQueueMessage,
  NewMemberAutomationQueueMessage,
} from '@crowd/types'

export class NodejsWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, NODEJS_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public override sendMessage(
    groupId: string,
    message: IQueueMessage,
    deduplicationId: string,
  ): Promise<void> {
    return super.sendMessage(groupId, message, deduplicationId)
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
    segmentId: string,
  ): Promise<void> {
    await this.sendMessage(
      `${activityId}--${segmentId}`,
      new NewActivityAutomationQueueMessage(tenantId, activityId, segmentId),
      `${activityId}--${segmentId}`,
    )
  }

  public async processAutomationForNewMember(tenantId: string, memberId: string): Promise<void> {
    await this.sendMessage(
      memberId,
      new NewMemberAutomationQueueMessage(tenantId, memberId),
      memberId,
    )
  }

  public async enrichMemberOrganizations(
    tenantId: string,
    memberId: string,
    organizationIds: string[],
  ): Promise<void> {
    await super.sendMessage(
      memberId,
      new EnrichMemberOrganizationsQueueMessage(tenantId, memberId, organizationIds),
    )
  }
}
