import {
  ChangeMessageVisibilityCommand,
  ChangeMessageVisibilityCommandOutput,
  ChangeMessageVisibilityRequest,
  CreateQueueCommand,
  DeleteMessageCommand,
  DeleteMessageRequest,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  ReceiveMessageRequest,
  SendMessageBatchCommand,
  SendMessageBatchCommandOutput,
  SendMessageBatchRequestEntry,
  SendMessageCommand,
  SendMessageRequest,
} from '@aws-sdk/client-sqs'

import { IS_DEV_ENV, IS_STAGING_ENV, generateUUIDv1, timeout } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IQueueMessage, IQueueMessageBulk } from '@crowd/types'

import {
  CrowdQueue,
  IQueue,
  IQueueChannel,
  IQueueProcessMessageHandler,
  IQueueSendResult,
} from '../../types'

import { configMap } from './config'
import {
  ISqsConfig,
  ISqsQueueDeleteOptions,
  ISqsQueueReceiveOptions,
  ISqsQueueSendOptions,
  ISqsQueueSetMessageVisibilityOptions,
  ISqsQueueStartOptions,
  SqsClient,
  SqsMessage,
  SqsQueueType,
} from './types'

export class SqsQueueService extends LoggerBase implements IQueue {
  private processingMessages: number
  private started: boolean

  public constructor(
    public readonly client: SqsClient,
    parentLog: Logger,
  ) {
    super(parentLog, {
      service: 'sqs-queue',
    })
    this.processingMessages = 0
    this.started = false
  }

  public async send(
    channel: IQueueChannel,
    message: IQueueMessage,
    groupId: string,
    options: ISqsQueueSendOptions,
  ): Promise<IQueueSendResult> {
    const retry = options.retry || 0
    let MessageDeduplicationId: string | undefined
    if (options.config.type === SqsQueueType.FIFO) {
      MessageDeduplicationId = options.deduplicationId || `${groupId}-${new Date().getTime()}`
    }
    const params: SendMessageRequest = {
      QueueUrl: channel.url,
      MessageGroupId: groupId,
      MessageDeduplicationId,
      MessageBody: JSON.stringify(message),
    }

    try {
      return this.client.send(new SendMessageCommand(params))
    } catch (err) {
      if (
        (err.message === 'Request is throttled.' ||
          err.message === 'Queue Throttled' ||
          (err.code === 'EAI_AGAIN' && err.syscall === 'getaddrinfo')) &&
        retry < 10
      ) {
        await timeout(1000)
        return await this.send(channel, message, groupId, { ...options, retry: retry + 1 })
      }

      throw err
    }
  }

  async receive(channel: IQueueChannel, options: ISqsQueueReceiveOptions): Promise<SqsMessage[]> {
    const now = performance.now()
    try {
      const params: ReceiveMessageRequest = {
        QueueUrl: channel.url,
      }

      params.MaxNumberOfMessages = options.receiveMessageCount || 1
      // max is 10
      if (params.MaxNumberOfMessages > 10) {
        params.MaxNumberOfMessages = 10
      }
      params.WaitTimeSeconds = 15

      if (options.visibilityTimeoutSeconds) {
        params.VisibilityTimeout = options.visibilityTimeoutSeconds
      } else {
        params.VisibilityTimeout =
          IS_DEV_ENV || IS_STAGING_ENV
            ? 2 * 60 // 2 minutes for dev environments
            : 10 * 60 // 10 minutes for production environment
      }

      try {
        const result = await this.client.send(new ReceiveMessageCommand(params))

        if (result.Messages && result.Messages.length > 0) {
          return result.Messages
        }

        return []
      } catch (err) {
        if (
          err.message === 'We encountered an internal error. Please try again.' ||
          err.message === 'Request is throttled.' ||
          err.message === 'Queue Throttled' ||
          (err.code === 'EAI_AGAIN' && err.syscall === 'getaddrinfo')
        ) {
          return []
        }

        throw err
      }
    } catch (err) {
      if (err.message === 'Request is throttled.') {
        return []
      }

      throw err
    } finally {
      const duration = performance.now() - now
      this.log.debug(`Received messages in ${duration.toFixed(2)}ms!`)
    }
  }

  public getClient() {
    return this.client
  }

  public async init(config: ISqsConfig): Promise<string> {
    try {
      const cmd = new GetQueueUrlCommand({
        QueueName: config.name,
      })
      const result = await this.client.send(cmd)
      this.log.info('Queue exists!')
      return result.QueueUrl
    } catch (err) {
      if (err.name === 'QueueDoesNotExist') {
        this.log.info('Queue does not exist, creating...')
        const createCommand = new CreateQueueCommand({
          QueueName: config.name,
          Attributes: {
            ReceiveMessageWaitTimeSeconds: `${config.waitTimeSeconds}`,
            VisibilityTimeout: `${config.visibilityTimeout}`,
            MessageRetentionPeriod: `${config.messageRetentionPeriod}`,
            DelaySeconds: `${config.deliveryDelay}`,
            ...(config.type === SqsQueueType.FIFO && {
              FifoQueue: 'true',
              ContentBasedDeduplication: 'false',
              FifoThroughputLimit: config.fifoThroughputLimit || 'perMessageGroupId',
              DeduplicationScope: config.deduplicationScope || 'messageGroup',
            }),
          },
        })
        const result = await this.client.send(createCommand)
        this.log.info('Queue created!')
        return result.QueueUrl
      } else {
        this.log.error(err, 'Error checking if queue exists!')
        throw err
      }
    }
  }

  private isAvailable(maxConcurrentMessageProcessing): boolean {
    return this.processingMessages < maxConcurrentMessageProcessing
  }

  private addJob() {
    this.processingMessages++
  }

  private removeJob() {
    this.processingMessages--
  }

  public async delete(channel: IQueueChannel, options?: ISqsQueueDeleteOptions): Promise<void> {
    const retry = options.retry || 0

    const params: DeleteMessageRequest = {
      QueueUrl: channel.url,
      ReceiptHandle: options.receiptHandle,
    }

    try {
      await this.client.send(new DeleteMessageCommand(params))
    } catch (err) {
      if (
        (err.message === 'Request is throttled.' ||
          err.message === 'Queue Throttled' ||
          (err.code === 'EAI_AGAIN' && err.syscall === 'getaddrinfo')) &&
        retry < 10
      ) {
        await timeout(1000)
        return await this.delete(channel, { ...options, retry: retry + 1 })
      }

      throw err
    }
  }

  public async setMessageVisibilityTimeout(
    channel: IQueueChannel,
    handle: string,
    newTimeout: number,
    options: ISqsQueueSetMessageVisibilityOptions,
  ): Promise<ChangeMessageVisibilityCommandOutput> {
    const retry = options.retry || 0

    const params: ChangeMessageVisibilityRequest = {
      QueueUrl: channel.url,
      ReceiptHandle: handle,
      VisibilityTimeout: newTimeout,
    }

    try {
      return this.client.send(new ChangeMessageVisibilityCommand(params))
    } catch (err) {
      if (
        (err.message === 'Request is throttled.' ||
          err.message === 'Queue Throttled' ||
          (err.code === 'EAI_AGAIN' && err.syscall === 'getaddrinfo')) &&
        retry < 10
      ) {
        await timeout(1000)
        return await this.setMessageVisibilityTimeout(channel, handle, newTimeout, {
          ...options,
          retry: retry + 1,
        })
      }

      throw err
    }
  }

  public async sendBulk(
    channel: IQueueChannel,
    messages: IQueueMessageBulk<IQueueMessage>[],
    options: ISqsQueueSendOptions,
  ): Promise<SendMessageBatchCommandOutput> {
    if (messages.length > 10) {
      throw new Error('Maximum number of messages to send is 10!')
    }
    const retry = options.retry || 0

    const time = new Date().getTime()

    const entries: SendMessageBatchRequestEntry[] = messages.map((msg) => {
      return {
        Id: msg.id || generateUUIDv1(),
        MessageBody: JSON.stringify(msg.payload),
        MessageDeduplicationId:
          options.config.type === SqsQueueType.FIFO
            ? msg.deduplicationId || `${msg.groupId}-${time}`
            : undefined,
        MessageGroupId: msg.groupId,
      }
    })

    try {
      return this.client.send(
        new SendMessageBatchCommand({
          QueueUrl: channel.url,
          Entries: entries,
        }),
      )
    } catch (err) {
      if (
        (err.message === 'Request is throttled.' ||
          err.message === 'Queue Throttled' ||
          (err.code === 'EAI_AGAIN' && err.syscall === 'getaddrinfo')) &&
        retry < 10
      ) {
        await timeout(1000)
        return await this.sendBulk(channel, messages, { ...options, retry: retry + 1 })
      }

      throw err
    }
  }
  public async start(
    processMessage: IQueueProcessMessageHandler,
    maxConcurrentMessageProcessing,
    queueConf: ISqsConfig,
    options: ISqsQueueStartOptions,
  ): Promise<void> {
    const queueUrl = await this.init(queueConf)
    const channel = {
      name: queueConf.name,
      url: queueUrl,
    }

    this.started = true
    this.log.info({ url: queueUrl }, 'Starting listening to queue...')
    while (this.started) {
      if (this.isAvailable(maxConcurrentMessageProcessing)) {
        // first receive the message
        const messages = await this.receive({ name: queueConf.name, url: queueUrl }, options)
        if (messages.length > 0) {
          while (messages.length > 0) {
            if (!this.isAvailable(maxConcurrentMessageProcessing)) {
              this.log.debug('Queue is busy, waiting...')
              await timeout(50)
              continue
            }
            const now = performance.now()

            const message = messages.shift()
            this.log.trace({ messageId: message.MessageId }, 'Received message from queue!')
            this.addJob()
            processMessage(JSON.parse(message.Body), { receiptHandle: message.ReceiptHandle })
              // when the message is processed, delete it from the queue
              .then(async () => {
                this.log.trace({ messageReceiptHandle: message.ReceiptHandle }, 'Deleting message')
                if (!options.deleteMessageImmediately) {
                  await this.delete(channel, {
                    receiptHandle: message.ReceiptHandle,
                  })
                }

                const duration = performance.now() - now
                this.log.debug(`Message processed successfully in ${duration.toFixed(2)}ms!`)
                this.removeJob()
              })
              // if error is detected don't delete the message from the queue
              .catch((err) => {
                this.log.error(err, 'Error processing message!')

                const duration = performance.now() - now
                this.log.debug(`Message processed unsuccessfully in ${duration.toFixed(2)}ms!`)
                this.removeJob()
              })

            if (options.deleteMessageImmediately) {
              await this.delete(channel, {
                receiptHandle: message.ReceiptHandle,
              })
            }
          }
        } else {
          this.log.warn('No messages in queue, waiting...')
          await timeout(50)
        }
      } else {
        this.log.debug('Queue is busy, waiting before receiving messages...')
        await timeout(50)
      }
    }
  }

  public stop() {
    this.started = false
  }

  public getMessageBody(message: SqsMessage): IQueueMessage {
    return JSON.parse(message.Body.toString())
  }

  public getMessageId(message: SqsMessage): string {
    return message.MessageId
  }

  public getReceiptHandle(message: SqsMessage): string {
    return message.ReceiptHandle
  }

  public getQueueChannelConfig(queue: CrowdQueue): ISqsConfig {
    return configMap[queue]
  }
}
