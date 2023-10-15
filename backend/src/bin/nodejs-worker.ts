import { timeout } from '@crowd/common'
import { Logger, getChildLogger, getServiceLogger, logExecutionTimeV2 } from '@crowd/logging'
import { SpanStatusCode, getServiceTracer } from '@crowd/tracing'
import { DeleteMessageRequest, Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import moment from 'moment'
import { SQS_CONFIG } from '../conf'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { NodeWorkerMessageType } from '../serverless/types/workerTypes'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageBase } from '../types/mq/nodeWorkerMessageBase'
import { deleteMessage, receiveMessage, sendMessage } from '../utils/sqs'
import { processIntegration, processWebhook } from './worker/integrations'

/* eslint-disable no-constant-condition */

const tracer = getServiceTracer()
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
  const delayedHandlerLogger = getChildLogger('delayedMessages', serviceLogger, {
    queue: SQS_CONFIG.nodejsWorkerDelayableQueue,
  })
  delayedHandlerLogger.info('Listing for delayed messages!')

  // noinspection InfiniteLoopJS
  while (!exiting) {
    const message = await receive(true)

    if (message) {
      tracer.startActiveSpan('ProcessDelayedMessage', async (span) => {
        try {
          const msg: NodeWorkerMessageBase = JSON.parse(message.Body)
          const messageLogger = getChildLogger('messageHandler', serviceLogger, {
            messageId: message.MessageId,
            type: msg.type,
          })

          if (message.MessageAttributes && message.MessageAttributes.remainingDelaySeconds) {
            // re-delay
            const newDelay = parseInt(
              message.MessageAttributes.remainingDelaySeconds.StringValue,
              10,
            )
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
          span.setStatus({
            code: SpanStatusCode.OK,
          })
        } catch (err) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err,
          })
        } finally {
          span.end()
        }
      })
    } else {
      delayedHandlerLogger.trace('No message received!')
    }
  }

  delayedHandlerLogger.warn('Exiting!')
}

let processingMessages = 0
const isWorkerAvailable = (): boolean => processingMessages <= 3
const addWorkerJob = (): void => {
  processingMessages++
}
const removeWorkerJob = (): void => {
  processingMessages--
}

async function handleMessages() {
  const handlerLogger = getChildLogger('messages', serviceLogger, {
    queue: SQS_CONFIG.nodejsWorkerQueue,
  })
  handlerLogger.info('Listening for messages!')

  const processSingleMessage = async (message: Message): Promise<void> => {
    tracer.startActiveSpan('ProcessMessage', async (span) => {
      const msg: NodeWorkerMessageBase = JSON.parse(message.Body)

      const messageLogger = getChildLogger('messageHandler', serviceLogger, {
        messageId: message.MessageId,
        type: msg.type,
      })

      try {
        if (
          msg.type === NodeWorkerMessageType.NODE_MICROSERVICE &&
          (msg as any).service === 'enrich_member_organizations'
        ) {
          messageLogger.warn(
            'Skipping enrich_member_organizations message! Purging the queue because they are not needed anymore!',
          )
          await removeFromQueue(message.ReceiptHandle)
          return
        }

        messageLogger.info(
          { messageType: msg.type, messagePayload: JSON.stringify(msg) },
          'Received a new queue message!',
        )

        let processFunction: (msg: NodeWorkerMessageBase, logger?: Logger) => Promise<void>

        switch (msg.type) {
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
            messageLogger.error('Error while parsing queue message! Invalid type.')
        }

        if (processFunction) {
          await logExecutionTimeV2(
            async () => {
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
            },
            messageLogger,
            'Processing queue message!',
          )
        }

        span.setStatus({
          code: SpanStatusCode.OK,
        })
      } catch (err) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err,
        })
        messageLogger.error(err, { payload: msg }, 'Error while processing queue message!')
      } finally {
        span.end()
      }
    })
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
