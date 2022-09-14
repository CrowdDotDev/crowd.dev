import moment from 'moment'
import { NodeWorkerMessage, NodeWorkerMessageType } from '../../types/worketTypes'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { KUBE_MODE, IS_TEST_ENV } from '../../../config/index'
import { NodeMicroserviceMessage } from './messageTypes'
import { sqs } from '../../../services/aws'
import { AutomationTrigger } from '../../../types/automationTypes'

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
  activityId: string,
): Promise<void> => {
  if (KUBE_MODE) {
    const payload = {
      type: NodeWorkerMessageType.AUTOMATION_TRIGGER,
      activityId,
      trigger: AutomationTrigger.NEW_ACTIVITY,
    }
    await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessage)
  } else {
    await sendNodeMicroserviceMessage({
      tenant,
      activityId,
      trigger: AutomationTrigger.NEW_ACTIVITY,
      service: 'automation',
    })
  }
}

export const sendNewMemberNodeSQSMessage = async (
  tenant: string,
  memberId: string,
): Promise<void> => {
  if (KUBE_MODE) {
    const payload = {
      type: NodeWorkerMessageType.AUTOMATION_TRIGGER,
      memberId,
      trigger: AutomationTrigger.NEW_MEMBER,
    }
    await sendNodeWorkerMessage(tenant, payload as NodeWorkerMessage)
  } else {
    await sendNodeMicroserviceMessage({
      tenant,
      memberId,
      trigger: AutomationTrigger.NEW_MEMBER,
      service: 'automation',
    })
  }
}

export default sendNodeMicroserviceMessage
