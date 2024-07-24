import { timeout } from '@crowd/common'
import { Logger, getChildLogger, getServiceLogger } from '@crowd/logging'
import { RedisClient, getRedisClient } from '@crowd/redis'
import fs from 'fs'
import path from 'path'
import { QueryTypes, Sequelize } from 'sequelize'
import telemetry from '@crowd/telemetry'
import { IQueueReceiveResponse } from '@crowd/queue'
import { QUEUE_CLIENT, getNodejsWorkerEmitter } from '@/serverless/utils/queueService'
import { databaseInit } from '@/database/databaseConnection'
import { REDIS_CONFIG, QUEUE_CONFIG } from '../conf'
import { processDbOperationsMessage } from '../serverless/dbOperations/workDispatcher'
import { processNodeMicroserviceMessage } from '../serverless/microservices/nodejs/workDispatcher'
import { NodeWorkerMessageType } from '../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../types/mq/nodeWorkerMessageBase'

/* eslint-disable no-constant-condition */

const serviceLogger = getServiceLogger()

let exiting = false

const messagesInProgress = new Map<string, NodeWorkerMessageBase>()

process.on('SIGTERM', async () => {
  serviceLogger.warn('Detected SIGTERM signal, started exiting!')
  exiting = true
})

const receive = async (queue: string): Promise<IQueueReceiveResponse | undefined> => {
  const client = QUEUE_CLIENT()

  const messages = await client.receive({
    name: queue,
  })

  if (messages && messages.length === 1) {
    return messages[0]
  }

  return undefined
}

const removeFromQueue = (queue: string, receiptHandle: string): Promise<void> => {
  const client = QUEUE_CLIENT()

  return client.delete(
    {
      name: queue,
    },
    {
      receiptHandle,
    },
  )
}

async function handleMessages(queue: string) {
  const client = QUEUE_CLIENT()

  const handlerLogger = getChildLogger('messages', serviceLogger, {
    queue,
  })
  handlerLogger.info('Listening for messages!')

  const processSingleMessage = async (message: IQueueReceiveResponse): Promise<void> => {
    const msg: NodeWorkerMessageBase = client.getMessageBody(message) as NodeWorkerMessageBase

    const messageId = client.getMessageId(message)
    const messageReceiptHandle = client.getReceiptHandle(message)

    const messageLogger = getChildLogger('messageHandler', serviceLogger, {
      messageId: client.getMessageId(message),
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
        await removeFromQueue(queue, messageReceiptHandle)
        return
      }

      messageLogger.debug({ messageType: msg.type }, 'Received a new queue message!')

      let processFunction: (msg: NodeWorkerMessageBase, logger?: Logger) => Promise<void>

      switch (msg.type) {
        case NodeWorkerMessageType.NODE_MICROSERVICE:
          processFunction = processNodeMicroserviceMessage
          break
        case NodeWorkerMessageType.DB_OPERATIONS:
          processFunction = processDbOperationsMessage
          break

        default:
          messageLogger.error('Error while parsing queue message! Invalid type.')
      }

      if (processFunction) {
        await telemetry.measure(
          'nodejs_worker.process_message',
          async () => {
            // remove the message from the queue as it's about to be processed
            await removeFromQueue(queue, messageReceiptHandle)
            messagesInProgress.set(messageId, msg)
            try {
              await processFunction(msg, messageLogger)
            } catch (err) {
              messageLogger.error(err, 'Error while processing queue message!')
            } finally {
              messagesInProgress.delete(messageId)
            }
          },
          {
            type: msg.type,
          },
        )
      } else {
        messageLogger.error(
          { messageType: msg.type },
          'Error while parsing queue message! Invalid type.',
        )
      }
    } catch (err) {
      messageLogger.error(err, { payload: msg }, 'Error while processing queue message!')
    }
  }

  let processingMessages = 0
  const isWorkerAvailable = (): boolean => processingMessages <= 3
  const addWorkerJob = (): void => {
    processingMessages++
  }
  const removeWorkerJob = (): void => {
    processingMessages--
  }

  // noinspection InfiniteLoopJS
  while (!exiting) {
    if (isWorkerAvailable()) {
      const message = await receive(queue)

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

let redis: RedisClient
let seq: Sequelize

const initRedisSeq = async () => {
  if (!redis) {
    redis = await getRedisClient(REDIS_CONFIG, true)
  }

  if (!seq) {
    seq = (await databaseInit()).sequelize as Sequelize
  }
}

setImmediate(async () => {
  await initRedisSeq()

  await getNodejsWorkerEmitter()
  await Promise.all([
    handleMessages(QUEUE_CONFIG.nodejsWorkerQueue),
    handleMessages(QUEUE_CONFIG.nodejsWorkerPriorityQueue),
  ])
})

const liveFilePath = path.join(__dirname, 'tmp/nodejs-worker-live.tmp')
const readyFilePath = path.join(__dirname, 'tmp/nodejs-worker-ready.tmp')

setInterval(async () => {
  try {
    await initRedisSeq()
    serviceLogger.debug('Checking liveness and readiness for nodejs worker.')
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
  } catch (err) {
    serviceLogger.error(`Error checking liveness and readiness for nodejs worker: ${err}`)
  }
}, 5000)
