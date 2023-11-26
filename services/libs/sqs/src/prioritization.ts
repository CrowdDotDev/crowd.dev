import { Logger } from '@crowd/logging'
import { Tracer } from '@crowd/tracing'
import {
  IQueueMessage,
  ISqsQueueEmitter,
  ISqsQueueReceiver,
  QueuePriorityLevel,
} from '@crowd/types'
import { SqsQueueEmitter, SqsQueueReceiver } from './queue'
import { ISqsQueueConfig, SqsClient } from './types'

export abstract class SqsPrioritizedQueueReciever {
  private readonly levelReceiver: ISqsQueueReceiver
  private readonly defaultReceiver: ISqsQueueReceiver

  public constructor(
    level: QueuePriorityLevel,
    sqsClient: SqsClient,
    queueConf: ISqsQueueConfig,
    maxConcurrentMessageProcessing: number,
    tracer: Tracer,
    parentLog: Logger,
    deleteMessageImmediately = false,
    visibilityTimeoutSeconds?: number,
    receiveMessageCount?: number,
  ) {
    const processFunc = this.processMessage

    this.defaultReceiver = new (class extends SqsQueueReceiver {
      constructor() {
        super(
          sqsClient,
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
    this.levelReceiver = new (class extends SqsQueueReceiver {
      constructor() {
        super(
          sqsClient,
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
    await this.defaultReceiver.start()
    await this.levelReceiver.start()
  }

  public stop(): void {
    this.defaultReceiver.stop()
    this.levelReceiver.stop()
  }

  public abstract processMessage(data: IQueueMessage, receiptHandle?: string): Promise<void>
}

export class SqsPrioritizedQueueEmitter {
  private readonly emittersMap: Map<QueuePriorityLevel, ISqsQueueEmitter> = new Map()
  private readonly defaultEmitter: ISqsQueueEmitter

  public constructor(
    sqsClient: SqsClient,
    queueConf: ISqsQueueConfig,
    tracer: Tracer,
    parentLog: Logger,
  ) {
    this.defaultEmitter = new SqsQueueEmitter(sqsClient, queueConf, tracer, parentLog)

    for (const level of Object.values(QueuePriorityLevel)) {
      const config = { ...queueConf, name: `${queueConf.name}-${level}` }
      this.emittersMap.set(level, new SqsQueueEmitter(sqsClient, config, tracer, parentLog))
    }
  }

  public async init(): Promise<void> {
    await Promise.all(
      Array.from(this.emittersMap.values())
        .map((e) => e.init())
        .concat([this.defaultEmitter.init()]),
    )
  }

  public async sendMessage(
    groupId: string,
    message: IQueueMessage,
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
}
