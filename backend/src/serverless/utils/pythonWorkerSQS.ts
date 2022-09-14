import moment from 'moment'
import { sqs } from '../../services/aws'
import { IS_TEST_ENV, KUBE_MODE, SQS_CONFIG } from '../../config'
import { PythonWorkerMessage } from '../types/worketTypes'

export const sendPythonWorkerMessage = async (
  tenantId: string,
  body: PythonWorkerMessage,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  if (!KUBE_MODE) {
    throw new Error("Can't send python-worker SQS message when not in kube mode!")
  }

  await sqs
    .sendMessage({
      QueueUrl: SQS_CONFIG.pythonWorkerQueue,
      MessageGroupId: tenantId,
      MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
      MessageBody: JSON.stringify(body),
    })
    .promise()
}
