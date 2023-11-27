import { timeout } from '@crowd/common'
import { Logger, getChildLogger, getServiceLogger, logExecutionTimeV2 } from '@crowd/logging'
import {
  SqsDeleteMessageRequest,
  SqsMessage,
  SqsReceiveMessageRequest,
  deleteMessage,
  receiveMessage,
  sendMessage,
} from '@crowd/sqs'
import { SpanStatusCode, getServiceTracer } from '@crowd/tracing'
import moment from 'moment'
import { getRedisClient, RedisClient } from '@crowd/redis'
import { Sequelize, QueryTypes } from 'sequelize'
import fs from 'fs'
import path from 'path'
import { REDIS_CONFIG, SQS_CONFIG } from '../conf'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { NodeWorkerMessageType } from '../serverless/types/workerTypes'
import { sendNodeWorkerMessage } from '../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageBase } from '../types/mq/nodeWorkerMessageBase'
import { processIntegration, processWebhook } from './worker/integrations'
import { SQS_CLIENT } from '@/serverless/utils/serviceSQS'
import { databaseInit } from '@/database/databaseConnection'

/* eslint-disable no-constant-condition */

const tracer = getServiceTracer()
const serviceLogger = getServiceLogger()

let exiting = false

const messagesInProgress = new Map<string, NodeWorkerMessageBase>()

process.on('SIGTERM', async () => {
  serviceLogger.warn('Detected SIGTERM signal, started exiting!')
  exiting = true
})

const receive = async (delayed?: boolean): Promise<SqsMessage | undefined> => {
  const params: SqsReceiveMessageRequest = {
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    MessageAttributeNames: !delayed
      ? undefined
      : ['remainingDelaySeconds', 'tenantId', 'targetQueueUrl'],
  }

  const messages = await receiveMessage(SQS_CLIENT(), params)

  if (messages && messages.length === 1) {
    return messages[0]
  }

  return undefined
}

const removeFromQueue = (receiptHandle: string, delayed?: boolean): Promise<void> => {
  const params: SqsDeleteMessageRequest = {
    QueueUrl: delayed ? SQS_CONFIG.nodejsWorkerDelayableQueue : SQS_CONFIG.nodejsWorkerQueue,
    ReceiptHandle: receiptHandle,
  }

  return deleteMessage(SQS_CLIENT(), params)
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
      await tracer.startActiveSpan('ProcessDelayedMessage', async (span) => {
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
              await sendMessage(SQS_CLIENT(), {
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

  const processSingleMessage = async (message: SqsMessage): Promise<void> => {
    await tracer.startActiveSpan('ProcessMessage', async (span) => {
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

let redis: RedisClient
if (!redis) {
  getRedisClient(REDIS_CONFIG, true).then((client) => {
    redis = client
  })
}

let seq: Sequelize
if (!seq) {
  databaseInit()
    .then((db) => {
      seq = db.sequelize as Sequelize
    })
    .catch((err) => {
      serviceLogger.error(err, 'Error initializing database connection.')
    })
}

const liveFilePath = path.join(__dirname, 'nodejs-worker-live.tmp')
const readyFilePath = path.join(__dirname, 'nodejs-worker-ready.tmp')

setInterval(async () => {
  try {
  const [redisPingRes, dbPingRes] = await Promise.all([
    // ping redis,
    redis.ping().then((res) => res === 'PONG'),
    // ping database
    seq.query('select 1', { type: QueryTypes.SELECT }).then((rows) => rows.length === 1),
  ])

  if (redisPingRes && dbPingRes) {
    await Promise.all([
      fs.promises.open(liveFilePath, 'a').then((file) => file.close()),
      fs.promises.open(readyFilePath, 'a').then((file) => file.close()),
    ])
  }
  }
  catch (err) {
    serviceLogger.error(`Error checking liveness and readiness for nodejs worker: ${err}`)
  }
}, 5000)
