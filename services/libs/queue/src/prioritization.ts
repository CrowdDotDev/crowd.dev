import { groupBy } from '@crowd/common'
import { Logger, getChildLogger } from '@crowd/logging'
import { IQueueMessage, QueuePriorityLevel } from '@crowd/types'

import { QueueEmitter, QueueReceiver } from './queue'
import { IQueue, IQueueConfig } from './types'

export abstract class PrioritizedQueueReciever {
  protected readonly log: Logger
  private readonly levelReceiver: QueueReceiver
  private readonly level: QueuePriorityLevel

  public constructor(
    level: QueuePriorityLevel,
    queue: IQueue,
    queueConf: IQueueConfig,
    maxConcurrentMessageProcessing: number,
    parentLog: Logger,
    deleteMessageImmediately = false,
    visibilityTimeoutSeconds?: number,
    receiveMessageCount?: number,
  ) {
    this.level = level
    this.log = getChildLogger(this.constructor.name, parentLog, {
      queueName: queueConf.name,
    })

    const processFunc = this.processMessage.bind(this)

    const config = { ...queueConf, name: `${queueConf.name}-${level}` }
    this.levelReceiver = new (class extends QueueReceiver {
      constructor() {
        super(
          queue,
          config,
          maxConcurrentMessageProcessing,
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
    await this.levelReceiver.start(this.levelReceiver.queueConf, this.level)
  }

  public stop(): void {
    this.levelReceiver.stop()
  }

  public abstract processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void>
}

export class PrioritizedQueueEmitter {
  private readonly emittersMap: Map<QueuePriorityLevel, QueueEmitter> = new Map()

  public constructor(queue: IQueue, queueConf: IQueueConfig, parentLog: Logger) {
    for (const level of Object.values(QueuePriorityLevel)) {
      const config = { ...queueConf, name: `${queueConf.name}-${level}` }
      this.emittersMap.set(level, new QueueEmitter(queue, config, parentLog))
    }
  }

  public isInitialized(): boolean {
    const allInitialized =
      Array.from(this.emittersMap.values()).find((e) => !e.isInitialized()) === undefined

    return allInitialized
  }

  public async init(): Promise<void> {
    for (const [level, emitter] of this.emittersMap.entries()) {
      await emitter.init(emitter.queueConf, level)
    }
  }

  public async setMessageVisibilityTimeout(
    receiptHandle: string,
    newVisibility: number,
    priorityLevel: QueuePriorityLevel,
  ): Promise<void> {
    const emitter = this.emittersMap.get(priorityLevel)
    if (!emitter) {
      throw new Error(`Unknown priority level: ${priorityLevel}`)
    }
    return emitter.setMessageVisibilityTimeout(receiptHandle, newVisibility)
  }

  public async sendMessage<T extends IQueueMessage>(
    groupId: string,
    message: T,
    priorityLevel: QueuePriorityLevel,
    deduplicationId?: string,
  ): Promise<void> {
    const emitter = this.emittersMap.get(priorityLevel)
    if (!emitter) {
      throw new Error(`Unknown priority level: ${priorityLevel}`)
    }
    return emitter.sendMessage(groupId, message, deduplicationId)
  }

  public async sendMessages<T extends IQueueMessage>(
    messages: {
      payload: T
      groupId: string
      deduplicationId?: string
      id?: string
      priorityLevel: QueuePriorityLevel
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
  }
}
