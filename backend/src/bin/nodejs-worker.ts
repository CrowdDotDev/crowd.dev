/* eslint-disable no-constant-condition */
import { DeleteMessageRequest, Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import { sqs } from '../services/aws'
import { SQS_CONFIG } from '../config'

const receiveMessage = (): Promise<Message | undefined> =>
  new Promise<Message | undefined>((resolve, reject) => {
    const params: ReceiveMessageRequest = {
      QueueUrl: SQS_CONFIG.nodejsWorkerQueue,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 15,
      VisibilityTimeout: 10,
    }

    sqs.receiveMessage(params, (err, data) => {
      if (err) {
        reject(err)
      } else if (data.Messages && data.Messages.length === 1) {
        resolve(data.Messages[0])
      } else {
        resolve(undefined)
      }
    })
  })

const deleteMessage = (receiptHandle: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const params: DeleteMessageRequest = {
      QueueUrl: SQS_CONFIG.nodejsWorkerQueue,
      ReceiptHandle: receiptHandle,
    }

    sqs.deleteMessage(params, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

const popMessage = async (): Promise<Message | undefined> => {
  const message = await receiveMessage()

  if (message) {
    await deleteMessage(message.ReceiptHandle)
  }

  return message
}

setImmediate(async () => {
  // noinspection InfiniteLoopJS
  while (true) {
    const message = await popMessage()

    if (message) {
      console.log('Received a new queue message: ', message.MessageId, message.Body)

      // need to process the message and dispatch it to worker functions based on type property
    }
  }
})
