import moment from 'moment'
import { NodeMicroserviceMessage } from './messageTypes'
import { getConfig } from '../../../config'
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

  const messageGroupId = body.tenant ? `${body.service}-${body.tenant}` : `${body.service}`
  const messageDeduplicationId = body.tenant
    ? `${body.service}-${body.tenant}-${moment().valueOf()}`
    : `${body.service}-${moment().valueOf()}`

  await sqs
    .sendMessage({
      QueueUrl: getConfig().NODE_MICROSERVICES_SQS_URL,
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
  await sendNodeMicroserviceMessage({
    tenant,
    activityId,
    trigger: AutomationTrigger.NEW_ACTIVITY,
    service: 'automation',
  })
}

export const sendNewMemberNodeSQSMessage = async (
  tenant: string,
  memberId: string,
): Promise<void> => {
  await sendNodeMicroserviceMessage({
    tenant,
    memberId,
    trigger: AutomationTrigger.NEW_MEMBER,
    service: 'automation',
  })
}

export default sendNodeMicroserviceMessage
