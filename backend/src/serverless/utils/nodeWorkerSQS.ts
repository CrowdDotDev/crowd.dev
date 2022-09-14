import moment from 'moment'
import { KUBE_MODE, IS_TEST_ENV, SQS_CONFIG } from '../../config/index'
import { sqs } from '../../services/aws'
import { NodeWorkerMessage } from '../types/worketTypes'

export const sendNodeWorkerMessage = async (
  tenantId: string,
  body: NodeWorkerMessage,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  if (!KUBE_MODE) {
    throw new Error("Can't send nodejs-worker SQS message when not in kube mode!")
  }

  await sqs
    .sendMessage({
      QueueUrl: SQS_CONFIG.nodejsWorkerQueue,
      MessageGroupId: tenantId,
      MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
      MessageBody: JSON.stringify(body),
    })
    .promise()
}
