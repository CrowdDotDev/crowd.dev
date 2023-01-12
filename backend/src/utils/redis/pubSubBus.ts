import RedisPubSubBase from './pubSub'
import {
  IRedisPubSubBus,
  IRedisPubSubEmitter,
  IRedisPubSubPair,
  IRedisPubSubReceiver,
} from './index'
import RedisPubSubEmitter from './pubSubEmitter'
import RedisPubSubReceiver from './pubSubReceiver'

export default class RedisPubSubBus extends RedisPubSubBase implements IRedisPubSubBus {
  private readonly emitter: IRedisPubSubEmitter

  private readonly receiver: IRedisPubSubReceiver

  public constructor(scope: string, redisPair: IRedisPubSubPair, errorHandler: (err: any) => void) {
    super(scope)

    this.emitter = new RedisPubSubEmitter(scope, redisPair.pubClient, errorHandler)
    this.receiver = new RedisPubSubReceiver(scope, redisPair.subClient, errorHandler)
  }

  public emit(channel: string, data: any) {
    this.emitter.emit(channel, data)
  }

  public subscribe(channel: string, listener: (data: any) => Promise<void>): string {
    return this.receiver.subscribe(channel, listener)
  }

  public unsubscribe(id: string) {
    this.receiver.unsubscribe(id)
  }
}
