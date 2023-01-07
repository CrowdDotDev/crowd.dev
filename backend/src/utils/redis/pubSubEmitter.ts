import { IRedisPubSubPair } from './index'
import { IPubSubMessage, PubSubBase } from './pubSub'

export interface IPubSubEmitter {
  emit<T extends IPubSubMessage>(message: T): void
}
export class PubSubEmitter extends PubSubBase implements IPubSubEmitter {
  public constructor(scope: string, redisPubSubPair: IRedisPubSubPair) {
    super(scope, redisPubSubPair)
  }

  public emit<T extends IPubSubMessage>(message: T): void {
    this.log.debug({ message }, 'Emitting message')
    this.nrp.emit(message.type, JSON.stringify(message))
  }
}
