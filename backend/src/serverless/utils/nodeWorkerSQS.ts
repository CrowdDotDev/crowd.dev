import moment from 'moment'
import { SQS } from '../../services/aws'
import { SQS_CONFIG } from '../../config'
import { NodeWorkerMessage } from '../types/worketTypes'

export const sendNodeWorkerMessage = async (
  tenantId: string,
  body: NodeWorkerMessage,
): Promise<void> => {
  await SQS.sendMessage({
    QueueUrl: SQS_CONFIG.nodejsWorkerQueue,
    MessageGroupId: tenantId,
    MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
  }).promise()
}
