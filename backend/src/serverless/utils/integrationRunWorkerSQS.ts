import moment from 'moment'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { IS_TEST_ENV, SQS_CONFIG } from '../../conf'
import { sendMessage } from '../../utils/sqs'

export const sendIntegrationRunWorkerMessage = async (
  tenantId: string,
  body: unknown,
): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  const params = {
    QueueUrl: SQS_CONFIG.integrationRunWorkerQueue,
    MessageGroupId: tenantId,
    MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
  }

  await sendMessage(params)
}

export const sendGenerateRunStreamsMessage = async (
  tenant: string,
  runId: string,
): Promise<void> => {
  const payload = {
    type: 'generate_run_streams',
    runId,
  }
  await sendIntegrationRunWorkerMessage(tenant, payload as NodeWorkerMessageBase)
}
