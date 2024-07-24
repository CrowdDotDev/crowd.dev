import { IS_PROD_ENV, IS_STAGING_ENV } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IQueue, IQueueChannel, IQueueConfig } from './types'
import { Tracer } from '@crowd/tracing'
import { IQueueMessage } from '@crowd/types'
export abstract class QueueBase extends LoggerBase {
  private readonly channelName: string
  private channelUrl: string | undefined
  tracer: Tracer

  constructor(
    public readonly queue: IQueue,
    public readonly queueConf: IQueueConfig,
    tracer: Tracer,
    parentLog: Logger,
  ) {
    super(parentLog, {
      queueName: queueConf.name,
    })

    this.tracer = tracer

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
    this.queue.init(this.queueConf)
  }
}

export abstract class QueueReceiver extends QueueBase {
  constructor(
    queue: IQueue,
    queueConf: IQueueConfig,
    private readonly maxConcurrentMessageProcessing: number,
    tracer: Tracer,
    parentLog: Logger,
    private readonly deleteMessageImmediately = false,
    private readonly visibilityTimeoutSeconds?: number,
    private readonly receiveMessageCount?: number,
  ) {
    super(queue, queueConf, tracer, parentLog)
  }

  public async start(queueConf: IQueueConfig): Promise<void> {
    await this.queue.start(this.processMessage, this.maxConcurrentMessageProcessing, queueConf)
  }

  public stop() {
    this.queue.stop()
  }

  protected abstract processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void>
}

export class QueueEmitter extends QueueBase {
  constructor(queue: IQueue, queueConf: IQueueConfig, tracer: Tracer, parentLog: Logger) {
    super(queue, queueConf, tracer, parentLog)
  }

  public async sendMessage<T extends IQueueMessage>(
    groupId: string,
    message: T,
    deduplicationId?: string,
  ): Promise<void> {
    await this.queue.send(this.getChannel(), message, {
      groupId,
      deduplicationId,
    })
  }

  public async sendMessages<T extends IQueueMessage>(
    messages: { payload: T; groupId: string; deduplicationId?: string; id?: string }[],
  ): Promise<void> {
    if (messages.length > 10) {
      throw new Error('Maximum number of messages to send is 10!')
    }
    this.queue.sendBulk(
      this.getChannel(),
      messages.map((m) => m.payload),
    )
  }

  public async setMessageVisibilityTimeout(
    receiptHandle: string,
    newVisibility: number,
  ): Promise<void> {
    await this.queue.setMessageVisibilityTimeout(receiptHandle, newVisibility)
  }
}
