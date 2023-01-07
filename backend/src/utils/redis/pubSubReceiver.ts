import { IPubSubMessage, PubSubBase } from './pubSub'
import { IRedisPubSubPair } from './index'

export interface IPubSubReceiver {
  on<T extends IPubSubMessage>(type: string, callback: (message: T) => Promise<void>): () => void

  onAll<T extends IPubSubMessage>(callback: (message: T) => Promise<void>): () => void
}

export class PubSubReceiver extends PubSubBase implements IPubSubReceiver {
  public constructor(scope: string, redisPubSubPair: IRedisPubSubPair) {
    super(scope, redisPubSubPair)
  }

  public on<T extends IPubSubMessage>(
    type: string,
    callback: (message: T) => Promise<void>,
  ): () => void {
    this.log.debug({ type }, 'Subscribing to message type!')
    return this.nrp.on(type, (data) => {
      const message: T = JSON.parse(data)
      callback(message).catch((err) => this.log.error(err, 'Error in PubSub handler!'))
    })
  }

  public onAll<T extends IPubSubMessage>(callback: (message: T) => Promise<void>): () => void {
    return this.nrp.on('*', (data) => {
      const message: T = JSON.parse(data)
      callback(message).catch((err) => this.log.error(err, 'Error in PubSub all messages handler!'))
    })
  }
}
