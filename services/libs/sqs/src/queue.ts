import {
  CreateQueueCommand,
  DeleteMessageRequest,
  GetQueueUrlCommand,
  ReceiveMessageRequest,
  SendMessageRequest,
} from '@aws-sdk/client-sqs'
import { IS_PROD_ENV, IS_STAGING_ENV, timeout } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { deleteMessage, receiveMessage, sendMessage } from './client'
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
        const message = await this.receiveMessage()
        if (message) {
          // process it and then delete it otherwise MessageGroupId does not work properly with FIFO queues
          // we also have 15 minuts to process the message otherwise it will be visible again and taken by a consumer again
          this.log.trace({ messageId: message.MessageId }, 'Received message from queue!')
          this.addJob()
          this.processMessage(JSON.parse(message.Body))
            // when the message is processed, delete it from the queue
            .then(async () => {
              await this.deleteMessage(message.ReceiptHandle)
              this.removeJob()
            })
            // if error is detected don't delete the message from the queue
            .catch(() => this.removeJob())
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

  private async receiveMessage(): Promise<SqsMessage | undefined> {
    const params: ReceiveMessageRequest = {
      QueueUrl: this.getQueueUrl(),
    }

    return receiveMessage(this.sqsClient, params)
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

  public async sendMessage<T extends IQueueMessage>(groupId: string, message: T): Promise<void> {
    const params: SendMessageRequest = {
      QueueUrl: this.getQueueUrl(),
      MessageGroupId: groupId,
      MessageDeduplicationId: this.isFifo ? `${groupId}-${new Date().getTime()}` : undefined,
      MessageBody: JSON.stringify(message),
    }

    await sendMessage(this.sqsClient, params)
  }
}
