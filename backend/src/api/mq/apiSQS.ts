import { SendMessageRequest } from 'aws-sdk/clients/sqs'
import moment from 'moment'
import { IS_TEST_ENV, SQS_CONFIG } from '../../config'
import { sendMessage } from '../../utils/sqs'
import { ApiWebsocketMessage } from '../../types/mq/apiWebsocketMessage'

export const sendApiMessage = async (tenantId: string, body: any): Promise<void> => {
  if (IS_TEST_ENV) {
    return
  }

  const params: SendMessageRequest = {
    QueueUrl: SQS_CONFIG.apiQueue,
    MessageGroupId: tenantId,
    MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
    MessageBody: JSON.stringify(body),
  }

  await sendMessage(params)
}

export const sendUserWebsocketMessage = async (
  userId: string,
  event: string,
  payload: any,
): Promise<void> => {
  const message = new ApiWebsocketMessage(event, JSON.stringify(payload), userId, undefined)
  return sendApiMessage(userId, message)
}

export const sendTenantWebsocketMessage = async (
  tenantId: string,
  event: string,
  payload: any,
): Promise<void> => {
  const message = new ApiWebsocketMessage(event, JSON.stringify(payload), undefined, tenantId)
  return sendApiMessage(tenantId, message)
}
