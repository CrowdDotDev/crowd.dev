import { groupBy } from '@crowd/common'
import { Logger, getChildLogger } from '@crowd/logging'
import { Tracer } from '@crowd/tracing'
import { IQueueMessage, QueuePriorityLevel } from '@crowd/types'
import { QueueReceiver, QueueEmitter } from './queue'
import { IQueue, IQueueConfig } from './types'

export abstract class PrioritizedQueueReciever {
  protected readonly log: Logger
  private readonly levelReceiver: QueueReceiver
  private readonly defaultReceiver: QueueReceiver

  public constructor(
    level: QueuePriorityLevel,
    queue: IQueue,
    queueConf: IQueueConfig,
    maxConcurrentMessageProcessing: number,
    protected readonly tracer: Tracer,
    parentLog: Logger,
    deleteMessageImmediately = false,
    visibilityTimeoutSeconds?: number,
    receiveMessageCount?: number,
  ) {
    this.log = getChildLogger(this.constructor.name, parentLog, {
      queueName: queueConf.name,
    })

    const processFunc = this.processMessage.bind(this)

    this.defaultReceiver = new (class extends QueueReceiver {
      constructor() {
        super(
          queue,
          queueConf,
          maxConcurrentMessageProcessing,
          tracer,
          parentLog,
          deleteMessageImmediately,
          visibilityTimeoutSeconds,
          receiveMessageCount,
        )
      }

      public async processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void> {
        return processFunc(data, receiptHandle)
      }
    })()

    const config = { ...queueConf, name: `${queueConf.name}-${level}` }
    this.levelReceiver = new (class extends QueueReceiver {
      constructor() {
        super(
          queue,
          config,
          maxConcurrentMessageProcessing,
          tracer,
          parentLog,
          deleteMessageImmediately,
          visibilityTimeoutSeconds,
          receiveMessageCount,
        )
      }

      public async processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void> {
        return processFunc(data, receiptHandle)
      }
    })()
  }

  public async start(): Promise<void> {
    await Promise.all([
      this.defaultReceiver.start(this.defaultReceiver.queueConf),
      this.levelReceiver.start(this.levelReceiver.queueConf),
    ])
  }

  public stop(): void {
    this.defaultReceiver.stop()
    this.levelReceiver.stop()
  }

  public abstract processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void>
}

export class PrioritizedQueueEmitter {
  private readonly emittersMap: Map<QueuePriorityLevel, QueueEmitter> = new Map()
  private readonly defaultEmitter: QueueEmitter

  public constructor(queue: IQueue, queueConf: IQueueConfig, tracer: Tracer, parentLog: Logger) {
    this.defaultEmitter = new QueueEmitter(queue, queueConf, tracer, parentLog)
    for (const level of Object.values(QueuePriorityLevel)) {
      const config = { ...queueConf, name: `${queueConf.name}-${level}` }
      this.emittersMap.set(level, new QueueEmitter(queue, config, tracer, parentLog))
    }
  }

  public isInitialized(): boolean {
    const allInitialized =
      Array.from(this.emittersMap.values()).find((e) => !e.isInitialized()) === undefined

    return allInitialized && this.defaultEmitter.isInitialized()
  }

  public async init(): Promise<void> {
    await Promise.all(
      Array.from(this.emittersMap.values())
        .map((e) => e.queue.init(e.queueConf))
        .concat(this.defaultEmitter.queue.init(this.defaultEmitter.queueConf)),
    )
  }

  public async setMessageVisibilityTimeout(
    receiptHandle: string,
    newVisibility: number,
    priorityLevel?: QueuePriorityLevel,
  ): Promise<void> {
    if (priorityLevel) {
      const emitter = this.emittersMap.get(priorityLevel)
      if (!emitter) {
        throw new Error(`Unknown priority level: ${priorityLevel}`)
      }
      return emitter.setMessageVisibilityTimeout(receiptHandle, newVisibility)
    } else {
      return this.defaultEmitter.setMessageVisibilityTimeout(receiptHandle, newVisibility)
    }
  }

  public async sendMessage<T extends IQueueMessage>(
    groupId: string,
    message: T,
    deduplicationId?: string,
    priorityLevel?: QueuePriorityLevel,
  ): Promise<void> {
    if (priorityLevel) {
      const emitter = this.emittersMap.get(priorityLevel)
      if (!emitter) {
        throw new Error(`Unknown priority level: ${priorityLevel}`)
      }
      return emitter.sendMessage(groupId, message, deduplicationId)
    } else {
      return this.defaultEmitter.sendMessage(groupId, message, deduplicationId)
    }
  }

  public async sendMessages<T extends IQueueMessage>(
    messages: {
      payload: T
      groupId: string
      deduplicationId?: string
      id?: string
      priorityLevel?: QueuePriorityLevel
    }[],
  ): Promise<void> {
    const grouped = groupBy(
      messages.filter((m) => m.priorityLevel !== undefined),
      (m) => m.priorityLevel,
    )

    for (const level of Array.from(grouped.keys()) as QueuePriorityLevel[]) {
      const emitter = this.emittersMap.get(level)
      if (!emitter) {
        throw new Error(`Unknown priority level: ${level}`)
      }

      const messages = grouped.get(level) || []
      if (messages.length > 0) {
        await emitter.sendMessages(messages)
      }
    }

    const noPriorityLevel = messages.filter((m) => m.priorityLevel === undefined)
    if (noPriorityLevel.length > 0) {
      await this.defaultEmitter.sendMessages(noPriorityLevel)
    }
  }
}
