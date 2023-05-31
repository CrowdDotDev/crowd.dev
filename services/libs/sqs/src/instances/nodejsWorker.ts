import { Logger } from '@crowd/logging'
import { NODEJS_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { NewActivityAutomationQueueMessage, NewMemberAutomationQueueMessage } from '@crowd/types'

export class NodejsWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, NODEJS_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
  ): Promise<void> {
    await this.sendMessage(tenantId, new NewActivityAutomationQueueMessage(tenantId, activityId))
  }

  public async processAutomationForNewMember(tenantId: string, memberId: string): Promise<void> {
    await this.sendMessage(tenantId, new NewMemberAutomationQueueMessage(tenantId, memberId))
  }
}
