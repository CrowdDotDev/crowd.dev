import {
  DeleteMessageCommandInput,
  Message,
  ReceiveMessageCommandInput,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs'
import { sqs } from '../services/aws'

export const receiveMessage = async (
  params: ReceiveMessageCommandInput,
): Promise<Message | undefined> => {
  params.MaxNumberOfMessages = 1
  params.WaitTimeSeconds = 15
  params.VisibilityTimeout = 15

  const result = await sqs.receiveMessage(params).promise()

  if (result.Messages && result.Messages.length === 1) {
    return result.Messages[0]
  }

  return undefined
}

export const deleteMessage = async (params: DeleteMessageCommandInput): Promise<void> => {
  await sqs.deleteMessage(params).promise()
}

export const sendMessage = async (params: SendMessageCommandInput): Promise<SendMessageCommandOutput> =>
  sqs.sendMessage(params).promise()
