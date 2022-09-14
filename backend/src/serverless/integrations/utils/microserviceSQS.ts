import moment from 'moment'
import { BaseOutput } from '../types/iteratorTypes'
import { MicroserviceMessage } from '../types/messageTypes'
import { KUBE_MODE } from '../../../config'

const { SQS } = require('aws-sdk')

const sqs = new SQS()

/**
 * Send a message to the microservice queue
 * @param body The message body
 * @returns Success or error codes
 */
async function sendMicroserviceMessage(body: MicroserviceMessage): Promise<BaseOutput> {
  const statusCode: number = 200

  console.log('SQS Message body: ', body)
  if (KUBE_MODE) {
    throw new Error("Can't send integrations SQS message in kube mode!")
  }

  await sqs
    .sendMessage({
      QueueUrl: process.env.PYTHON_MICROSERVICES_SQS_URL,
      MessageGroupId: `${body.service}-${body.tenant}`,
      MessageDeduplicationId: `${body.service}-${body.tenant}-${moment().unix()}`,
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

export default sendMicroserviceMessage
