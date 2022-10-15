/* eslint-disable no-constant-condition */
import { DeleteMessageRequest, Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { SQS_CONFIG } from '../config/index'
import { createChildLogger, createServiceLogger } from '../utils/logging'
import { sqs } from '../services/aws'
import { NodeWorkerMessage, NodeWorkerMessageType } from '../serverless/types/worketTypes'
import { processIntegrationsMessage } from '../serverless/integrations/workDispatcher'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'

const receiveMessage = (delayed?: boolean): Promise<Message | undefined> =>
  new Promise<Message | undefined>((resolve, reject) => {
    const params: ReceiveMessageRequest = {
      QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 15,
      VisibilityTimeout: 15,
      MessageAttributeNames: !delayed ? undefined : ['remainingDelaySeconds', 'tenantId'],
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

const deleteMessage = (receiptHandle: string, delayed?: boolean): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const params: DeleteMessageRequest = {
      QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
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

const serviceLogger = createServiceLogger()

async function handleDelayedMessages() {
  const delayedHandlerLogger = createChildLogger(serviceLogger, 'delayedMessages', {
    queue: SQS_CONFIG.nodejsWorkerDelayableQueue,
  })
  delayedHandlerLogger.info('Listing for delayed messages!')

  // noinspection InfiniteLoopJS
  while (true) {
    const message = await receiveMessage(true)

    if (message) {
      const msg: NodeWorkerMessage = JSON.parse(message.Body)
      const messageLogger = createChildLogger(delayedHandlerLogger, 'messageHandler', {
        messageId: message.MessageId,
        type: msg.type,
      })

      if (message.MessageAttributes && message.MessageAttributes.remainingDelaySeconds) {
        // re-delay
        const newDelay = parseInt(message.MessageAttributes.remainingDelaySeconds.StringValue, 10)
        const tenantId = message.MessageAttributes.tenantId.StringValue
        messageLogger.info({ newDelay, tenantId }, 'Re-delaying message!')
        await sendNodeWorkerMessage(tenantId, msg, newDelay)
      } else {
        // just emit to the normal queue for processing
        const tenantId = message.MessageAttributes.tenantId.StringValue
        messageLogger.info({ tenantId }, 'Successfully delayed a message!')
        await sendNodeWorkerMessage(tenantId, msg)
      }

      await deleteMessage(message.ReceiptHandle, true)
    } else {
      delayedHandlerLogger.trace('No message received!')
    }
  }
}

async function handleMessages() {
  const handlerLogger = createChildLogger(serviceLogger, 'messages', {
    queue: SQS_CONFIG.nodejsWorkerQueue,
  })
  handlerLogger.info('Listening for messages!')

  // noinspection InfiniteLoopJS
  while (true) {
    const message = await receiveMessage()

    if (message) {
      const msg: NodeWorkerMessage = JSON.parse(message.Body)

      const messageLogger = createChildLogger(handlerLogger, 'messageHandler', {
        messageId: message.MessageId,
        type: msg.type,
      })

      messageLogger.info('Received a new queue message!')

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
          messageLogger.error('Error while parsing queue message! Invalid type.')
      }

      if (!keep) {
        // remove the message from the queue as it's about to be processed
        await deleteMessage(message.ReceiptHandle)

        try {
          await processFunction(msg)
        } catch (err) {
          messageLogger.error(err, 'Error while processing queue message!')
        }
      } else {
        messageLogger.warn('Keeping the message in the queue!')
      }
    } else {
      serviceLogger.trace('No message received!')
    }
  }
}

setImmediate(async () => {
  const promises = [handleMessages(), handleDelayedMessages()]
  await Promise.all(promises)
})
