import { MessageBodyAttributeMap } from 'aws-sdk/clients/sqs'
import moment from 'moment'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { KUBE_MODE, IS_TEST_ENV, SQS_CONFIG } from '../../config'
import { sendMessage } from '../../utils/sqs'
import { NodeWorkerMessageType } from '../types/workerTypes'
import { AutomationTrigger } from '../../types/automationTypes'

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

  // TODO-kube
  if (!KUBE_MODE) {
    throw new Error("Can't send nodejs-worker delayed SQS message when not in kube mode!")
  }

  // we can only delay for 15 minutes then we have to re-delay message
  let attributes: MessageBodyAttributeMap
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

  const params = {
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    MessageGroupId: delayed ? undefined : tenantId,
    MessageDeduplicationId: delayed ? undefined : `${tenantId}-${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
    MessageAttributes: attributes,
    DelaySeconds: delay,
  }

  await sendMessage(params)
}

export const sendNewActivityNodeSQSMessage = async (
  tenant: string,
  activity: any,
): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    tenant,
    activity,
    trigger: AutomationTrigger.NEW_ACTIVITY,
    service: 'automation',
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}

export const sendNewMemberNodeSQSMessage = async (tenant: string, member: any): Promise<void> => {
  const payload = {
    type: NodeWorkerMessageType.NODE_MICROSERVICE,
    tenant,
    member,
    trigger: AutomationTrigger.NEW_MEMBER,
    service: 'automation',
  }
  await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}
