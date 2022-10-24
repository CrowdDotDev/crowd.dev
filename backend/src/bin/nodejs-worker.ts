import { DeleteMessageRequest, Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import moment from 'moment'
import { SQS_CONFIG } from '../config'
import { NodeWorkerMessageType } from '../serverless/types/workerTypes'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerIntegrationCheckMessage } from '../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../types/mq/nodeWorkerIntegrationProcessMessage'
import { NodeWorkerMessageBase } from '../types/mq/nodeWorkerMessageBase'
import { createChildLogger, getServiceLogger } from '../utils/logging'
import { deleteMessage, receiveMessage, sendMessage } from '../utils/sqs'
import { timeout } from '../utils/timing'
import { processIntegration, processIntegrationCheck } from './worker/integrations'

/* eslint-disable no-constant-condition */

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

const serviceLogger = getServiceLogger()

async function handleDelayedMessages() {
  const delayedHandlerLogger = createChildLogger('delayedMessages', serviceLogger, {
    queue: SQS_CONFIG.nodejsWorkerDelayableQueue,
  })
  delayedHandlerLogger.info('Listing for delayed messages!')

  // noinspection InfiniteLoopJS
  while (true) {
    const message = await receive(true)

    if (message) {
      const msg: NodeWorkerMessageBase = JSON.parse(message.Body)
      const messageLogger = createChildLogger('messageHandler', serviceLogger, {
        messageId: message.MessageId,
        receipt: message.ReceiptHandle,
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

        if (message.MessageAttributes.targetQueueUrl) {
          const targetQueueUrl = message.MessageAttributes.targetQueueUrl.StringValue
          messageLogger.info({ tenantId, targetQueueUrl }, 'Successfully delayed a message!')
          await sendMessage({
            QueueUrl: targetQueueUrl,
            MessageGroupId: tenantId,
            MessageDeduplicationId: `${tenantId}-${moment().valueOf()}`,
            MessageBody: JSON.stringify(msg),
          })
        } else {
          messageLogger.info({ tenantId }, 'Successfully delayed a message!')
          await sendNodeWorkerMessage(tenantId, msg)
        }
      }

      await removeFromQueue(message.ReceiptHandle, true)
    } else {
      delayedHandlerLogger.trace('No message received!')
    }
  }
}

let processingMessages = 5
const isWorkerAvailable = (): boolean => processingMessages <= 5
const addWorkerJob = (): number => processingMessages++
const removeWorkerJob = (): number => processingMessages--

async function handleMessages() {
  const handlerLogger = createChildLogger('messages', serviceLogger, {
    queue: SQS_CONFIG.nodejsWorkerQueue,
  })
  handlerLogger.info('Listening for messages!')

  const processSingleMessage = async (message: Message): Promise<void> => {
    const msg: NodeWorkerMessageBase = JSON.parse(message.Body)

    const messageLogger = createChildLogger('messageHandler', serviceLogger, {
      messageId: message.MessageId,
      receipt: message.ReceiptHandle,
      type: msg.type,
    })

    try {
      messageLogger.info('Received a new queue message!')

      let processFunction: (msg: NodeWorkerMessageBase) => Promise<void>
      let keep = false

      switch (msg.type) {
        case NodeWorkerMessageType.INTEGRATION_CHECK:
          await removeFromQueue(message.ReceiptHandle)
          await processIntegrationCheck(messageLogger, msg as NodeWorkerIntegrationCheckMessage)
          break
        case NodeWorkerMessageType.INTEGRATION_PROCESS:
          await removeFromQueue(message.ReceiptHandle)
          await processIntegration(messageLogger, msg as NodeWorkerIntegrationProcessMessage)
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

      if (processFunction) {
        if (!keep) {
          // remove the message from the queue as it's about to be processed
          await removeFromQueue(message.ReceiptHandle)

          try {
            await processFunction(msg)
          } catch (err) {
            messageLogger.error(err, 'Error while processing queue message!')
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
  while (true) {
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
}

setImmediate(async () => {
  const promises = [handleMessages(), handleDelayedMessages()]
  await Promise.all(promises)
})
