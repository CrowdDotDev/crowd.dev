import { MessageBodyAttributeMap } from 'aws-sdk/clients/sqs'
import moment from 'moment'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { KUBE_MODE, IS_TEST_ENV, SQS_CONFIG } from '../../config'
import { sendMessage } from '../../utils/sqs'

// 15 minute limit for delaying
const limitSeconds = 10

export const sendNodeWorkerMessage = async (
  tenantId: string,
  body: NodeWorkerMessageBase,
  delaySeconds?: number,
  targetQueueUrl?: string,
): Promise<void> => {
  console.log('Sending a new nodejs worker message!', tenantId, body, delaySeconds)
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
        targetQueueUrl: targetQueueUrl
          ? { DataType: 'String', StringValue: targetQueueUrl }
          : undefined,
      }
      delay = limitSeconds
    } else {
      attributes = {
        tenantId: {
          DataType: 'String',
          StringValue: tenantId,
        },
        targetQueueUrl: targetQueueUrl
          ? { DataType: 'String', StringValue: targetQueueUrl }
          : undefined,
      }
      delay = delaySeconds
    }

    delayed = true
  }

  await sendMessage({
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    MessageGroupId: delayed ? undefined : tenantId,
    MessageDeduplicationId: delayed ? undefined : `${tenantId}-${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
    MessageAttributes: attributes,
    DelaySeconds: delay,
  })
}
