import { IS_DEV_ENV } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import {
  DeleteMessageCommand,
  DeleteMessageRequest,
  ReceiveMessageCommand,
  ReceiveMessageRequest,
  SQSClient,
  SendMessageCommand,
  SendMessageRequest,
  SendMessageResult,
} from '@aws-sdk/client-sqs'
import { ISqsClientConfig, SqsClient, SqsMessage } from './types'

const log = getServiceChildLogger('sqs.client')

let client: SqsClient | undefined
export const getSqsClient = (config: ISqsClientConfig): SqsClient => {
  if (client) return client

  log.info('Creating new SQS client...')
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
): Promise<SqsMessage | undefined> => {
  params.MaxNumberOfMessages = 1
  params.WaitTimeSeconds = 15

  params.VisibilityTimeout = IS_DEV_ENV ? 60 : 15 * 60 // 15 minutes

  const result = await client.send(new ReceiveMessageCommand(params))

  if (result.Messages && result.Messages.length === 1) {
    return result.Messages[0]
  }

  return undefined
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
