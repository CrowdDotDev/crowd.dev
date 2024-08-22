import { IS_PROD_ENV, IS_STAGING_ENV } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IQueueMessage, IQueueMessageBulk } from '@crowd/types'
import { IQueue, IQueueChannel, IQueueConfig } from './types'
export abstract class QueueBase extends LoggerBase {
  private readonly channelName: string
  private channelUrl: string | undefined

  constructor(
    public readonly queue: IQueue,
    public readonly queueConf: IQueueConfig,
    parentLog: Logger,
  ) {
    super(parentLog, {
      queueName: queueConf.name,
    })

    let env = ''
    if (IS_STAGING_ENV) {
      env = '-staging'
    } else if (IS_PROD_ENV) {
      env = '-production'
    }
    this.channelName = `${queueConf.name}${env}`
  }

  public isInitialized(): boolean {
    return this.channelUrl !== undefined
  }

  protected getQueueUrl(): string {
    if (this.channelUrl) {
      return this.channelUrl
    }

    throw new Error('Queue URL not set - please call init() first!')
  }

  protected getQueueName(): string {
    if (this.channelName) {
      return this.channelName
    }

    throw new Error('Queue name not set!')
  }

  protected getChannel(): IQueueChannel {
    return {
      name: this.channelName,
      url: this.channelUrl,
    }
  }

  public async init() {
    const url = await this.queue.init(this.queueConf)
    this.channelUrl = url
  }
}

export abstract class QueueReceiver extends QueueBase {
  constructor(
    queue: IQueue,
    queueConf: IQueueConfig,
    private readonly maxConcurrentMessageProcessing: number,
    parentLog: Logger,
    private readonly deleteMessageImmediately = false,
    private readonly visibilityTimeoutSeconds?: number,
    private readonly receiveMessageCount?: number,
  ) {
    super(queue, queueConf, parentLog)
  }

  public async start(queueConf: IQueueConfig): Promise<void> {
    await this.queue.start(this.processMessage, this.maxConcurrentMessageProcessing, queueConf, {
      deleteMessageImmediately: this.deleteMessageImmediately,
      visibilityTimeoutSeconds: this.visibilityTimeoutSeconds,
      receiveMessageCount: this.receiveMessageCount,
    })
  }

  public stop() {
    this.queue.stop()
  }

  public receive(channel: IQueueChannel) {
    return this.queue.receive(channel, {
      deleteMessageImmediately: this.deleteMessageImmediately,
      visibilityTimeoutSeconds: this.visibilityTimeoutSeconds,
      receiveMessageCount: this.receiveMessageCount,
    })
  }

  protected abstract processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void>
}

export class QueueEmitter extends QueueBase {
  constructor(queue: IQueue, queueConf: IQueueConfig, parentLog: Logger) {
    super(queue, queueConf, parentLog)
  }

  public async sendMessage<T extends IQueueMessage>(
    groupId: string,
    message: T,
    deduplicationId?: string,
  ): Promise<void> {
    this.log.info(
      { groupId, message, channel: this.getChannel() },
      '[DBGX2] Sending message to queue!',
    )
    await this.queue.send(this.getChannel(), message, groupId, {
      deduplicationId,
      config: this.queueConf,
    })
  }

  public async sendMessages<T extends IQueueMessage>(
    messages: IQueueMessageBulk<T>[],
  ): Promise<void> {
    if (messages.length > 10) {
      throw new Error('Maximum number of messages to send is 10!')
    }
    this.queue.sendBulk(this.getChannel(), messages)
  }

  public async setMessageVisibilityTimeout(
    receiptHandle: string,
    newVisibility: number,
  ): Promise<void> {
    await this.queue.setMessageVisibilityTimeout(this.getChannel(), receiptHandle, newVisibility)
  }
}
