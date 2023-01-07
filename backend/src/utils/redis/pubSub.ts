import NRP, { NodeRedisPubSub } from 'node-redis-pubsub'
import { IRedisPubSubPair } from './index'
import { createServiceChildLogger, Logger } from '../logging'

const log = createServiceChildLogger('redis/pubSub')

export interface IPubSubMessage {
  type: string
}

export abstract class PubSubBase {
  protected readonly nrp: NodeRedisPubSub

  protected readonly log: Logger

  protected constructor(public readonly scope: string, redisPubSubPair: IRedisPubSubPair) {
    this.log = log.child({ scope }, true)

    this.nrp = new NRP.NodeRedisPubSub({
      scope,
      emitter: redisPubSubPair.pubClient,
      receiver: redisPubSubPair.subClient,
    })

    this.nrp.on('error', (err) => {
      this.log.error(err, 'Error in Redis PubSub!')
    })
  }
}
