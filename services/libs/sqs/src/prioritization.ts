import { Logger } from '@crowd/logging'
import { Tracer } from '@crowd/tracing'
import { IQueueMessage, ISqsQueueEmitter, QueuePriorityLevel } from '@crowd/types'
import { SqsQueueEmitter } from './queue'
import { ISqsQueueConfig, SqsClient } from './types'

export class SqsPrioritizedQueueEmitter implements ISqsQueueEmitter {
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
