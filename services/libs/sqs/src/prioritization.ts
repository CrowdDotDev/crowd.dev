import { Logger } from '@crowd/logging'
import { Tracer } from '@crowd/tracing'
import { IQueueMessage, ISqsQueueEmitter, QueuePriorityLevel } from '@crowd/types'
import { SqsQueueEmitter } from 'queue'
import { ISqsQueueConfig, SqsClient } from './types'

export class SqsPrioritizedQueueEmitter implements ISqsQueueEmitter {
  private readonly emittersMap: Map<QueuePriorityLevel, ISqsQueueEmitter> = new Map()

  public constructor(
    sqsClient: SqsClient,
    queueConf: ISqsQueueConfig,
    tracer: Tracer,
    parentLog: Logger,
  ) {
    for (const level of Object.values(QueuePriorityLevel)) {
      const config = { ...queueConf, name: `${queueConf.name}-${level}` }
      this.emittersMap.set(
        level,
        new (class extends SqsQueueEmitter {
          constructor() {
            super(sqsClient, config, tracer, parentLog)
          }
        })(),
      )
    }
  }

  public async init(): Promise<void> {
    await Promise.all(Array.from(this.emittersMap.values()).map((e) => e.init()))
  }

  public async sendMessage(
    groupId: string,
    message: IQueueMessage,
    deduplicationId?: string,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
