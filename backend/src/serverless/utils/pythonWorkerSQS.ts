import moment from 'moment'
import { SQS } from '../../services/aws'
import { SQS_CONFIG } from '../../config'

export interface PythonWorkerMessage {
  type: string
}

export const sendPythonWorkerMessage = async (
  tenantId: string,
  body: PythonWorkerMessage,
): Promise<void> => {
  await SQS.sendMessage({
    QueueUrl: SQS_CONFIG.pythonWorkerQueue,
    MessageGroupId: tenantId,
    MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
  }).promise()
}
