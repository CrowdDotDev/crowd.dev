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
import { IS_DEV_ENV, IS_STAGING_ENV, timeout } from '@crowd/common'
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

  try {
    const result = await client.send(new ReceiveMessageCommand(params))

    if (result.Messages && result.Messages.length > 0) {
      return result.Messages
    }

    return []
  } catch (err) {
    if (
      err.message === 'We encountered an internal error. Please try again.' ||
      err.message === 'Request is throttled.' ||
      err.message === 'Queue Throttled'
    ) {
      return []
    }

    throw err
  }
}

export const deleteMessage = async (
  client: SqsClient,
  params: DeleteMessageRequest,
  retry = 0,
): Promise<void> => {
  try {
    await client.send(new DeleteMessageCommand(params))
  } catch (err) {
    if (
      (err.message === 'Request is throttled.' || err.message === 'Queue Throttled') &&
      retry < 5
    ) {
      await timeout(1000)
      return await deleteMessage(client, params, retry + 1)
    }

    throw err
  }
}

export const sendMessage = async (
  client: SqsClient,
  params: SendMessageRequest,
  retry = 0,
): Promise<SendMessageResult> => {
  try {
    return client.send(new SendMessageCommand(params))
  } catch (err) {
    if (
      (err.message === 'Request is throttled.' || err.message === 'Queue Throttled') &&
      retry < 5
    ) {
      await timeout(1000)
      return await sendMessage(client, params, retry + 1)
    }

    throw err
  }
}

export const sendMessagesBulk = async (
  client: SqsClient,
  params: SendMessageBatchRequest,
  retry = 0,
): Promise<SendMessageBatchCommandOutput> => {
  try {
    return client.send(new SendMessageBatchCommand(params))
  } catch (err) {
    if (
      (err.message === 'Request is throttled.' || err.message === 'Queue Throttled') &&
      retry < 5
    ) {
      await timeout(1000)
      return await sendMessagesBulk(client, params, retry + 1)
    }

    throw err
  }
}
