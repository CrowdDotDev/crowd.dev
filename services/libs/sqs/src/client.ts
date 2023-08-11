import {
  DeleteMessageCommand,
  DeleteMessageRequest,
  ReceiveMessageCommand,
  ReceiveMessageRequest,
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchCommandOutput,
  SendMessageBatchRequest,
  SendMessageCommand,
  SendMessageRequest,
  SendMessageResult,
} from '@aws-sdk/client-sqs'
import { IS_DEV_ENV, IS_STAGING_ENV } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { ISqsClientConfig, SqsClient, SqsMessage } from './types'

const log = getServiceChildLogger('sqs.client')

let client: SqsClient | undefined
export const getSqsClient = (config: ISqsClientConfig): SqsClient => {
  if (client) return client

  log.info(
    { host: config.host, port: config.port, region: config.region },
    'Creating new SQS client...',
  )
  client = new SQSClient({
    region: config.region,
    endpoint: config.host ? `http://${config.host}:${config.port}` : undefined,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
  return client
}

export const receiveMessage = async (
  client: SqsClient,
  params: ReceiveMessageRequest,
  visibilityTimeoutSeconds?: number,
  maxMessages?: number,
): Promise<SqsMessage[]> => {
  params.MaxNumberOfMessages = maxMessages || 1
  params.WaitTimeSeconds = 15

  if (visibilityTimeoutSeconds) {
    params.VisibilityTimeout = visibilityTimeoutSeconds
  } else {
    params.VisibilityTimeout =
      IS_DEV_ENV || IS_STAGING_ENV
        ? 2 * 60 // 2 minutes for dev environments
        : 10 * 60 // 10 minutes for production environment
  }

  const result = await client.send(new ReceiveMessageCommand(params))

  if (result.Messages && result.Messages.length > 0) {
    return result.Messages
  }

  return []
}

export const deleteMessage = async (
  client: SqsClient,
  params: DeleteMessageRequest,
): Promise<void> => {
  await client.send(new DeleteMessageCommand(params))
}

export const sendMessage = async (
  client: SqsClient,
  params: SendMessageRequest,
): Promise<SendMessageResult> => {
  return client.send(new SendMessageCommand(params))
}

export const sendMessagesBulk = async (
  client: SqsClient,
  params: SendMessageBatchRequest,
): Promise<SendMessageBatchCommandOutput> => {
  return client.send(new SendMessageBatchCommand(params))
}
