import { DeleteMessageRequest, Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import moment from 'moment'
import { SQS_CONFIG } from '../config'
import { NodeWorkerMessageType } from '../serverless/types/workerTypes'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageBase } from '../types/mq/nodeWorkerMessageBase'
import { createChildLogger, getServiceLogger, Logger } from '../utils/logging'
import { deleteMessage, receiveMessage, sendMessage } from '../utils/sqs'
import { timeout } from '../utils/timing'
import { processIntegration, processIntegrationCheck, processWebhook } from './worker/integrations'

/* eslint-disable no-constant-condition */

const serviceLogger = getServiceLogger()

let exiting = false

const messagesInProgress = new Map<string, NodeWorkerMessageBase>()

process.on('SIGTERM', async () => {
  serviceLogger.warn('Detected SIGTERM signal, started exiting!')
  exiting = true
})

const receive = (delayed?: boolean): Promise<Message | undefined> => {
  const params: ReceiveMessageRequest = {
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    MessageAttributeNames: !delayed
      ? undefined
      : ['remainingDelaySeconds', 'tenantId', 'targetQueueUrl'],
  }

  return receiveMessage(params)
}

const removeFromQueue = (receiptHandle: string, delayed?: boolean): Promise<void> => {
  const params: DeleteMessageRequest = {
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    ReceiptHandle: receiptHandle,
  }

  return deleteMessage(params)
}

async function handleDelayedMessages() {
  const delayedHandlerLogger = createChildLogger('delayedMessages', serviceLogger, {
    queue: SQS_CONFIG.nodejsWorkerDelayableQueue,
  })
  delayedHandlerLogger.info('Listing for delayed messages!')

  // noinspection InfiniteLoopJS
  while (!exiting) {
    const message = await receive(true)

    if (message) {
      const msg: NodeWorkerMessageBase = JSON.parse(message.Body)
      const messageLogger = createChildLogger('messageHandler', serviceLogger, {
        messageId: message.MessageId,
        type: msg.type,
      })

      if (message.MessageAttributes && message.MessageAttributes.remainingDelaySeconds) {
        // re-delay
        const newDelay = parseInt(message.MessageAttributes.remainingDelaySeconds.StringValue, 10)
        const tenantId = message.MessageAttributes.tenantId.StringValue
        messageLogger.debug({ newDelay, tenantId }, 'Re-delaying message!')
        await sendNodeWorkerMessage(tenantId, msg, newDelay)
      } else {
        // just emit to the normal queue for processing
        const tenantId = message.MessageAttributes.tenantId.StringValue

        if (message.MessageAttributes.targetQueueUrl) {
          const targetQueueUrl = message.MessageAttributes.targetQueueUrl.StringValue
          messageLogger.debug({ tenantId, targetQueueUrl }, 'Successfully delayed a message!')
          await sendMessage({
            QueueUrl: targetQueueUrl,
            MessageGroupId: tenantId,
            MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
            MessageBody: JSON.stringify(msg),
          })
        } else {
          messageLogger.debug({ tenantId }, 'Successfully delayed a message!')
          await sendNodeWorkerMessage(tenantId, msg)
        }
      }

      await removeFromQueue(message.ReceiptHandle, true)
    } else {
      delayedHandlerLogger.trace('No message received!')
    }
  }

  delayedHandlerLogger.warn('Exiting!')
}

let processingMessages = 0
const isWorkerAvailable = (): boolean => processingMessages <= 2
const addWorkerJob = (): void => {
  processingMessages++
}
const removeWorkerJob = (): void => {
  processingMessages--
}

async function handleMessages() {
  const handlerLogger = createChildLogger('messages', serviceLogger, {
    queue: SQS_CONFIG.nodejsWorkerQueue,
  })
  handlerLogger.info('Listening for messages!')

  const processSingleMessage = async (message: Message): Promise<void> => {
    const msg: NodeWorkerMessageBase = JSON.parse(message.Body)

    const messageLogger = createChildLogger('messageHandler', serviceLogger, {
      messageId: message.MessageId,
      type: msg.type,
    })

    try {
      messageLogger.debug('Received a new queue message!')

      let processFunction: (msg: NodeWorkerMessageBase, logger?: Logger) => Promise<void>
      let keep = false

      switch (msg.type) {
        case NodeWorkerMessageType.INTEGRATION_CHECK:
          processFunction = processIntegrationCheck
          break
        case NodeWorkerMessageType.INTEGRATION_PROCESS:
          processFunction = processIntegration
          break
        case NodeWorkerMessageType.NODE_MICROSERVICE:
          processFunction = processNodeMicroserviceMessage
          break
        case NodeWorkerMessageType.DB_OPERATIONS:
          processFunction = processDbOperationsMessage
          break
        case NodeWorkerMessageType.PROCESS_WEBHOOK:
          processFunction = processWebhook
          break

        default:
          keep = true
          messageLogger.error('Error while parsing queue message! Invalid type.')
      }

      if (processFunction) {
        if (!keep) {
          // remove the message from the queue as it's about to be processed
          await removeFromQueue(message.ReceiptHandle)
          messagesInProgress.set(message.MessageId, msg)
          try {
            await processFunction(msg, messageLogger)
          } catch (err) {
            messageLogger.error(err, 'Error while processing queue message!')
          } finally {
            messagesInProgress.delete(message.MessageId)
          }
        } else {
          messageLogger.warn('Keeping the message in the queue!')
        }
      }
    } catch (err) {
      messageLogger.error(err, { payload: msg }, 'Error while processing queue message!')
    }
  }

  // noinspection InfiniteLoopJS
  while (!exiting) {
    if (isWorkerAvailable()) {
      const message = await receive()

      if (message) {
        addWorkerJob()
        processSingleMessage(message).then(removeWorkerJob).catch(removeWorkerJob)
      } else {
        serviceLogger.trace('No message received!')
      }
    } else {
      await timeout(200)
    }
  }

  // mark in flight messages as exiting
  for (const msg of messagesInProgress.values()) {
    ;(msg as any).exiting = true
  }

  while (messagesInProgress.size !== 0) {
    handlerLogger.warn(`Waiting for ${messagesInProgress.size} messages to finish!`)
    await timeout(500)
  }

  handlerLogger.warn('Exiting!')
}

setImmediate(async () => {
  const promises = [handleMessages(), handleDelayedMessages()]
  await Promise.all(promises)
})
