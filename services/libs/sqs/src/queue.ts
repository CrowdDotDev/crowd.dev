import {
  CreateQueueCommand,
  DeleteMessageRequest,
  GetQueueUrlCommand,
  ReceiveMessageRequest,
  SendMessageRequest,
} from '@aws-sdk/client-sqs'
import { timeout } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { deleteMessage, receiveMessage, sendMessage } from './client'
import { ISqsQueueConfig, SqsClient, SqsMessage, SqsQueueType } from './types'
import { IQueueMessage } from '@crowd/types'

export abstract class SqsQueueBase extends LoggerBase {
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
  }

  protected getQueueUrl(): string {
    if (this.queueUrl) {
      return this.queueUrl
    }

    throw new Error('Queue URL not set - please call start() first!')
  }

  public async init() {
    try {
      const cmd = new GetQueueUrlCommand({
        QueueName:
          this.queueConf.type === SqsQueueType.FIFO
            ? `${this.queueConf.name}.fifo`
            : this.queueConf.name,
      })
      const result = await this.sqsClient.send(cmd)
      this.queueUrl = result.QueueUrl
    } catch (err) {
      if (err.name === 'QueueDoesNotExist') {
        this.log.info('Queue does not exist, creating...')
        const createCommand = new CreateQueueCommand({
          QueueName:
            this.queueConf.type === SqsQueueType.FIFO
              ? `${this.queueConf.name}.fifo`
              : this.queueConf.name,
          Attributes: {
            ReceiveMessageWaitTimeSeconds: `${this.queueConf.waitTimeSeconds}`,
            VisibilityTimeout: `${this.queueConf.visibilityTimeout}`,
            MessageRetentionPeriod: `${this.queueConf.messageRetentionPeriod}`,
            DelaySeconds: `${this.queueConf.deliveryDelay}`,
            ...(this.queueConf.type === SqsQueueType.FIFO && {
              FifoQueue: 'true',
              ContentBasedDeduplication: 'false',
              HighThroughputFifoEnabled: this.queueConf.highThroughputFifo ? 'true' : 'false',
              FifoThroughputLimit: this.queueConf.fifoThroughputLimit || 'PerMessageGroupId',
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
    this.log.info('Starting listening to queue...')
    while (this.started) {
      if (this.isAvailable()) {
        const message = await this.receiveMessage()
        if (message) {
          this.log.trace({ messageId: message.MessageId }, 'Received message from queue!')
          this.addJob()
          await this.deleteMessage(message.ReceiptHandle)
          this.processMessage(JSON.parse(message.Body))
            .then(() => this.removeJob())
            .catch(() => this.removeJob())
        }
      } else {
        this.log.trace('Queue is busy, waiting...')
        await timeout(1000)
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

export abstract class SqsQueueSender extends SqsQueueBase {
  constructor(sqsClient: SqsClient, queueConf: ISqsQueueConfig, parentLog: Logger) {
    super(sqsClient, queueConf, parentLog)
  }

  protected async sendMessage(groupId: string, message: IQueueMessage): Promise<void> {
    const params: SendMessageRequest = {
      QueueUrl: this.getQueueUrl(),
      MessageGroupId: groupId,
      MessageDeduplicationId: this.isFifo ? `${groupId}-${new Date().getTime()}` : undefined,
      MessageBody: JSON.stringify(message),
    }

    await sendMessage(this.sqsClient, params)
  }
}
