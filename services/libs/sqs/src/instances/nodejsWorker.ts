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
    this.log.info(
      {
        messageType: message.type,
      },
      'Sending nodejs-worker sqs message!',
    )
    return super.sendMessage(groupId, message, deduplicationId)
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
    segmentId: string,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      new NewActivityAutomationQueueMessage(tenantId, activityId, segmentId),
      `${activityId}--${segmentId}`,
    )
  }

  public async processAutomationForNewMember(tenantId: string, memberId: string): Promise<void> {
    await this.sendMessage(
      tenantId,
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
      tenantId,
      new EnrichMemberOrganizationsQueueMessage(tenantId, memberId, organizationIds),
    )
  }
}
