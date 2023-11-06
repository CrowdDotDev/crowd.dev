import { MessageAttributeValue } from "@aws-sdk/client-sqs";
import moment from 'moment'
import { getServiceChildLogger } from '@crowd/logging'
import { AutomationTrigger } from '@crowd/types'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { IS_TEST_ENV, SQS_CONFIG } from '../../conf'
import { sendMessage } from '../../utils/sqs'
import { NodeWorkerMessageType } from '../types/workerTypes'
import { ExportableEntity } from '../microservices/nodejs/messageTypes'

const log = getServiceChildLogger('nodeWorkerSQS')

// 15 minute limit for delaying is max for SQS
const limitSeconds = 15 * 60

export const sendNodeWorkerMessage = async (
  tenantId: string,
  body: NodeWorkerMessageBase,
  delaySeconds?: number,
  targetQueueUrl?: string,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  // we can only delay for 15 minutes then we have to re-delay message
  let attributes: Record<string, MessageAttributeValue>
  let delay: number
  let delayed = false
  if (delaySeconds) {
    if (delaySeconds > limitSeconds) {
      // delay for 15 minutes and add the remaineder to the attributes
      const remainedSeconds = delaySeconds - limitSeconds
      attributes = {
        tenantId: {
          DataType: 'String',
          StringValue: tenantId,
        },
        remainingDelaySeconds: {
          DataType: 'Number',
          StringValue: `${remainedSeconds}`,
        },
      }

      if (targetQueueUrl) {
        attributes.targetQueueUrl = { DataType: 'String', StringValue: targetQueueUrl }
      }
      delay = limitSeconds
    } else {
      attributes = {
        tenantId: {
          DataType: 'String',
          StringValue: tenantId,
        },
      }
      if (targetQueueUrl) {
        attributes.targetQueueUrl = { DataType: 'String', StringValue: targetQueueUrl }
      }
      delay = delaySeconds
    }

    delayed = true
  }

  const now = moment().valueOf()

  const params = {
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    MessageGroupId: delayed ? undefined : `${now}`,
    MessageDeduplicationId: delayed ? undefined : `${tenantId}-${now}`,
    MessageBody: JSON.stringify(body),
    MessageAttributes: attributes,
    DelaySeconds: delay,
  }

  log.debug(
    {
      messageType: body.type,
      body,
    },
    'Sending nodejs-worker sqs message!',
  )
  await sendMessage(params)
}

export const sendNewActivityNodeSQSMessage = async (
  tenant: string,
  activityId: string,
  segmentId: string,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    tenant,
    activityId,
    segmentId,
    trigger: AutomationTrigger.NEW_ACTIVITY,
    service: 'automation',
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendNewMemberNodeSQSMessage = async (
  tenant: string,
  memberId: string,
  segmentId: string,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    tenant,
    memberId,
    segmentId,
    trigger: AutomationTrigger.NEW_MEMBER,
    service: 'automation',
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendExportCSVNodeSQSMessage = async (
  tenant: string,
  user: string,
  entity: ExportableEntity,
  segmentIds: string[],
  criteria: any,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'csv-export',
    user,
    tenant,
    entity,
    criteria,
    segmentIds,
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendBulkEnrichMessage = async (
  tenant: string,
  memberIds: string[],
  segmentIds: string[],
  notifyFrontend: boolean = true,
  skipCredits: boolean = false,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    service: 'bulk-enrich',
    memberIds,
    tenant,
    segmentIds,
    notifyFrontend,
    skipCredits,
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}
