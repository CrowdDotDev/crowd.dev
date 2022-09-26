import moment from 'moment'
import { sqs } from './aws'
import { IS_TEST_ENV, SQS_CONFIG } from './config'

export const sendPremiumPythonWorkerMessage = async (
  body: any,
  groupId?: string,
  deduplicationId?: string,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  console.log(
    'Sending message to premium python worker queue!',
    SQS_CONFIG.premiumPythonWorkerQueue,
    body,
  )
  const response = await sqs
    .sendMessage({
      QueueUrl: SQS_CONFIG.premiumPythonWorkerQueue,
      MessageGroupId: groupId || 'premium-python-worker',
      MessageDeduplicationId: deduplicationId || `${moment().valueOf()}`,
      MessageBody: JSON.stringify(body),
    })
    .promise()
}
