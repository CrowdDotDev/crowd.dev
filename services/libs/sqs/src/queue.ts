import {
  CreateQueueCommand,
  DeleteMessageRequest,
  GetQueueUrlCommand,
  ReceiveMessageRequest,
  SendMessageBatchRequestEntry,
  SendMessageRequest,
} from '@aws-sdk/client-sqs'
import { IS_PROD_ENV, IS_STAGING_ENV, generateUUIDv1, timeout } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { deleteMessage, receiveMessage, sendMessage, sendMessagesBulk } from './client'
import { ISqsQueueConfig, SqsClient, SqsMessage, SqsQueueType } from './types'
import { IQueueMessage, ISqsQueueEmitter } from '@crowd/types'

export abstract class SqsQueueBase extends LoggerBase {
  private readonly queueName: string
  private queueUrl: string | undefined
  protected readonly isFifo: boolean

  constructor(
    protected readonly sqsClient: SqsClient,
    public readonly queueConf: ISqsQueueConfig,
    parentLog: Logger,
  ) {
    super(parentLog, {
      queueName: queueConf.name,
      type: queueConf.type,
    })

    this.isFifo = queueConf.type === SqsQueueType.FIFO

    let env = ''
    if (IS_STAGING_ENV) {
      env = '-staging'
    } else if (IS_PROD_ENV) {
      env = '-production'
    }

    if (this.isFifo) {
      this.queueName = `${queueConf.name}${env}.fifo`
    } else {
      this.queueName = `${queueConf.name}${env}`
    }
  }

  public isInitialized(): boolean {
    return this.queueUrl !== undefined
  }

  protected getQueueUrl(): string {
    if (this.queueUrl) {
      return this.queueUrl
    }

    throw new Error('Queue URL not set - please call init() first!')
  }

  public async init() {
    try {
      const cmd = new GetQueueUrlCommand({
        QueueName: this.queueName,
      })
      const result = await this.sqsClient.send(cmd)
      this.log.info('Queue exists!')
      this.queueUrl = result.QueueUrl
    } catch (err) {
      if (err.name === 'QueueDoesNotExist') {
        this.log.info('Queue does not exist, creating...')
        const createCommand = new CreateQueueCommand({
          QueueName: this.queueName,
          Attributes: {
            ReceiveMessageWaitTimeSeconds: `${this.queueConf.waitTimeSeconds}`,
            VisibilityTimeout: `${this.queueConf.visibilityTimeout}`,
            MessageRetentionPeriod: `${this.queueConf.messageRetentionPeriod}`,
            DelaySeconds: `${this.queueConf.deliveryDelay}`,
            ...(this.queueConf.type === SqsQueueType.FIFO && {
              FifoQueue: 'true',
              ContentBasedDeduplication: 'false',
              FifoThroughputLimit: this.queueConf.fifoThroughputLimit || 'perMessageGroupId',
              DeduplicationScope: this.queueConf.deduplicationScope || 'messageGroup',
            }),
          },
        })
        const result = await this.sqsClient.send(createCommand)
        this.queueUrl = result.QueueUrl
        this.log.info('Queue created!')
      } else {
        this.log.error(err, 'Error checking if queue exists!')
        throw err
      }
    }
  }
}

export abstract class SqsQueueReceiver extends SqsQueueBase {
  private processingMessages = 0
  private started = false

  constructor(
    sqsClient: SqsClient,
    queueConf: ISqsQueueConfig,
    private readonly maxConcurrentMessageProcessing: number,
    parentLog: Logger,
    private readonly deleteMessageImmediately = false,
    private readonly visibilityTimeoutSeconds?: number,
    private readonly receiveMessageCount?: number,
  ) {
    super(sqsClient, queueConf, parentLog)
  }

  private isAvailable(): boolean {
    return this.processingMessages < this.maxConcurrentMessageProcessing
  }

  private addJob() {
    this.processingMessages++
  }

  private removeJob() {
    this.processingMessages--
  }

  public async start(): Promise<void> {
    await this.init()

    this.started = true
    this.log.info({ url: this.getQueueUrl() }, 'Starting listening to queue...')
    while (this.started) {
      if (this.isAvailable()) {
        // first receive the message
        const messages = await this.receiveMessage()
        if (messages.length > 0) {
          for (const message of messages) {
            if (this.isAvailable()) {
              this.log.trace({ messageId: message.MessageId }, 'Received message from queue!')
              this.addJob()
              this.processMessage(JSON.parse(message.Body))
                // when the message is processed, delete it from the queue
                .then(async () => {
                  this.log.trace(
                    { messageReceiptHandle: message.ReceiptHandle },
                    'Deleting message',
                  )
                  if (!this.deleteMessageImmediately) {
                    await this.deleteMessage(message.ReceiptHandle)
                  }
                  this.removeJob()
                })
                // if error is detected don't delete the message from the queue
                .catch(() => this.removeJob())

              if (this.deleteMessageImmediately) {
                await this.deleteMessage(message.ReceiptHandle)
              }
            } else {
              this.log.trace('Queue is busy, waiting...')
              await timeout(100)
            }
          }
        }
      } else {
        this.log.trace('Queue is busy, waiting...')
        await timeout(200)
      }
    }
  }

  public stop() {
    this.started = false
  }

  protected abstract processMessage(data: IQueueMessage): Promise<void>

  private async receiveMessage(): Promise<SqsMessage[]> {
    const params: ReceiveMessageRequest = {
      QueueUrl: this.getQueueUrl(),
    }

    return receiveMessage(
      this.sqsClient,
      params,
      this.visibilityTimeoutSeconds,
      this.receiveMessageCount,
    )
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    const params: DeleteMessageRequest = {
      QueueUrl: this.getQueueUrl(),
      ReceiptHandle: receiptHandle,
    }

    return deleteMessage(this.sqsClient, params)
  }
}

export abstract class SqsQueueEmitter extends SqsQueueBase implements ISqsQueueEmitter {
  constructor(sqsClient: SqsClient, queueConf: ISqsQueueConfig, parentLog: Logger) {
    super(sqsClient, queueConf, parentLog)
  }

  public async sendMessage<T extends IQueueMessage>(
    groupId: string,
    message: T,
    deduplicationId?: string,
  ): Promise<void> {
    let MessageDeduplicationId: string | undefined
    if (this.isFifo) {
      MessageDeduplicationId = deduplicationId || `${groupId}-${new Date().getTime()}`
    }
    const params: SendMessageRequest = {
      QueueUrl: this.getQueueUrl(),
      MessageGroupId: groupId,
      MessageDeduplicationId,
      MessageBody: JSON.stringify(message),
    }

    await sendMessage(this.sqsClient, params)
  }

  public async sendMessages<T extends IQueueMessage>(
    messages: { payload: T; groupId: string; deduplicationId?: string; id?: string }[],
  ): Promise<void> {
    if (messages.length > 10) {
      throw new Error('Maximum number of messages to send is 10!')
    }
    const time = new Date().getTime()

    const entries: SendMessageBatchRequestEntry[] = messages.map((msg) => {
      return {
        Id: msg.id || generateUUIDv1(),
        MessageBody: JSON.stringify(msg.payload),
        MessageDeduplicationId: this.isFifo
          ? msg.deduplicationId || `${msg.groupId}-${time}`
          : undefined,
        MessageGroupId: msg.groupId,
      }
    })

    await sendMessagesBulk(this.sqsClient, {
      QueueUrl: this.getQueueUrl(),
      Entries: entries,
    })
  }
}
