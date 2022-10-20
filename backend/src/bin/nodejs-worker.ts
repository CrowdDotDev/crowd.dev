import { DeleteMessageRequest, Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import { timeout } from '../utils/timing'
import { sqs } from '../services/aws'
import { SQS_CONFIG } from '../config'
import { NodeWorkerMessage, NodeWorkerMessageType } from '../serverless/types/worketTypes'
import { processIntegrationsMessage } from '../serverless/integrations/workDispatcher'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'

/* eslint-disable no-constant-condition */

const receiveMessage = (): Promise<Message | undefined> =>
  new Promise<Message | undefined>((resolve, reject) => {
    const params: ReceiveMessageRequest = {
      QueueUrl: SQS_CONFIG.nodejsWorkerQueue,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 15,
      VisibilityTimeout: 15,
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

async function processMessage(message: Message): Promise<void> {
  const msg: NodeWorkerMessage = JSON.parse(message.Body)
  console.log('Received a new queue message: ', message.MessageId, msg.type)

  let processFunction: (msg: NodeWorkerMessage) => Promise<void>
  let keep = false

  switch (msg.type) {
    case NodeWorkerMessageType.INTEGRATION:
      processFunction = processIntegrationsMessage
      break
    case NodeWorkerMessageType.NODE_MICROSERVICE:
      processFunction = processNodeMicroserviceMessage
      break
    case NodeWorkerMessageType.DB_OPERATIONS:
      processFunction = processDbOperationsMessage
      break

    default:
      keep = true
      console.log('Error while parsing NodeJS Worker queue message! Invalid type: ', msg.type)
  }

  if (!keep) {
    // remove the message from the queue as it's about to be processed
    await deleteMessage(message.ReceiptHandle)

    try {
      await processFunction(msg)
    } catch (err) {
      console.log('Error while processing NodeJS Worker queue message!', err)
    }
  } else {
    console.log('Warning keeping the message in the queue!', message.MessageId)
  }
}

let processingMessages = 0

const isWorkerFull = (): boolean => processingMessages <= 5
const addWorkerJob = (): number => processingMessages++
const removeWorkerJob = (): number => processingMessages--

setImmediate(async () => {
  console.log('Listening for messages on: ', SQS_CONFIG.nodejsWorkerQueue)

  // noinspection InfiniteLoopJS
  while (true) {
    if (isWorkerFull()) {
      const message = await receiveMessage()

      if (message) {
        addWorkerJob()
        processMessage(message).then(removeWorkerJob).catch(removeWorkerJob)
      }
    } else {
      await timeout(1000)
    }
  }
})
