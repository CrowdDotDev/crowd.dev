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

  await sqs.sendMessage({
    QueueUrl: SQS_CONFIG.premiumPythonWorkerQueue,
    MessageGroupId: groupId,
    MessageDeduplicationId: deduplicationId || `${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
  })
}
