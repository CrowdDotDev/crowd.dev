import moment from 'moment'
import { sqs } from '../../services/aws'
import { IS_TEST_ENV, KUBE_MODE, SQS_CONFIG } from '../../conf'
import { PythonWorkerMessage } from '../types/workerTypes'

export const sendPythonWorkerMessage = async (
  tenantId: string,
  body: PythonWorkerMessage,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  // TODO-kube
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
