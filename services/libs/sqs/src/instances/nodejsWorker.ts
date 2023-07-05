import { Logger } from '@crowd/logging'
import { NODEJS_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import {
  IQueueMessage,
  NewActivityAutomationQueueMessage,
  NewMemberAutomationQueueMessage,
} from '@crowd/types'

export class NodejsWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, NODEJS_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public override sendMessage(groupId: string, message: IQueueMessage): Promise<void> {
    this.log.info(
      {
        messageType: message.type,
      },
      'Sending nodejs-worker sqs message!',
    )
    return super.sendMessage(groupId, message)
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
    segmentId: string,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      new NewActivityAutomationQueueMessage(tenantId, activityId, segmentId),
    )
  }

  public async processAutomationForNewMember(tenantId: string, memberId: string): Promise<void> {
    await this.sendMessage(tenantId, new NewMemberAutomationQueueMessage(tenantId, memberId))
  }
}
