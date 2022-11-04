// TODO-kube

import moment from 'moment'
import { NodeWorkerMessageType } from '../../types/workerTypes'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { KUBE_MODE, IS_TEST_ENV } from '../../../config'
import { NodeMicroserviceMessage } from './messageTypes'
import { sqs } from '../../../services/aws'
import { AutomationTrigger } from '../../../types/automationTypes'
import { NodeWorkerMessageBase } from '../../../types/mq/nodeWorkerMessageBase'

/**
 * Send a message to the node microservice queue
 * @param body The message body
 * @returns Success or error codes
 */
async function sendNodeMicroserviceMessage(body: NodeMicroserviceMessage): Promise<any> {
  const statusCode: number = 200
  console.log('SQS Message body: ', body)

  if (IS_TEST_ENV) {
    return {
      status: statusCode,
      msg: JSON.stringify({
        body,
      }),
    }
  }

  if (KUBE_MODE) {
    throw new Error("Can't send node-microservices SQS message in kube mode!")
  }

  const messageGroupId = body.tenant ? `${body.service}-${body.tenant}` : `${body.service}`
  const messageDeduplicationId = body.tenant
    ? `${body.service}-${body.tenant}-${moment().valueOf()}`
    : `${body.service}-${moment().valueOf()}`

  await sqs
    .sendMessage({
      QueueUrl: process.env.NODE_MICROSERVICES_SQS_URL,
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: messageDeduplicationId,
      MessageBody: JSON.stringify(body),
    })
    .promise()

  const message = 'Message accepted!'

  return {
    status: statusCode,
    msg: JSON.stringify({
      message,
    }),
  }
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

export default sendNodeMicroserviceMessage
