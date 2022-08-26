import moment from 'moment'
import { NodeMicroserviceMessage } from './messageTypes'
import { getConfig } from '../../../config'
import { sqs } from '../../../services/aws'


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
    ? `${body.service}-${body.tenant}-${moment().unix()}`
    : `${body.service}-${moment().unix()}`

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

export default sendNodeMicroserviceMessage
