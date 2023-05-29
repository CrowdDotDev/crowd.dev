import { Logger, LoggerBase } from '@crowd/logging'
import {
  IRedisPubSubReceiver,
  RedisClient,
  IRedisPubSubEmitter,
  IRedisPubSubBus,
  IRedisPubSubPair,
} from './types'
import { generateUUIDv1 } from '@crowd/common'

abstract class RedisPubSubBase extends LoggerBase {
  protected readonly prefix: string

  constructor(scope: string, parentLog: Logger) {
    super(parentLog, {
      pubSubScope: scope,
    })

    this.prefix = `${scope}:`
  }
}

type MessageHandler = (msg: unknown) => Promise<void>

interface MessageHandlerInfo {
  id: string
  handler: MessageHandler
}

export class RedisPubSubReceiver extends RedisPubSubBase implements IRedisPubSubReceiver {
  private subscriptionMap: Map<string, MessageHandlerInfo[]> = new Map()

  public constructor(
    scope: string,
    private readonly receiver: RedisClient,
    errorHandler: (err: unknown) => void,
    parentLog: Logger,
  ) {
    super(scope, parentLog)

    receiver.on('error', (err) => {
      this.log.error({ err }, 'Redis sub client error!')
      errorHandler(err)
    })

    this.receiver.pSubscribe(`${this.prefix}*`, (message, channel) => {
      const data = JSON.parse(message)
      this.log.debug({ channel, data }, 'Received Redis Pub/Sub message!')
      const infos = this.subscriptionMap.get(channel)
      if (infos) {
        for (const info of infos) {
          info.handler(data).catch(() => {})
        }
      }
    })

    this.log.info({ scope: `${this.prefix}*` }, 'Redis Pub/Sub receiver initialized!')
  }

  public subscribe<T>(channel: string, handler: (data: T) => Promise<void>): string {
    const id = generateUUIDv1()

    const info = { id, handler }
    const infos = this.subscriptionMap.get(`${this.prefix}${channel}`) || []
    infos.push(info)
    this.subscriptionMap.set(`${this.prefix}${channel}`, infos)

    return id
  }

  public unsubscribe(id: string) {
    for (const [channel, infos] of this.subscriptionMap.entries()) {
      const index = infos.findIndex((info) => info.id === id)
      if (index >= 0) {
        infos.splice(index, 1)
        if (infos.length === 0) {
          this.subscriptionMap.delete(channel)
        }

        return
      }
    }
  }
}

export class RedisPubSubEmitter extends RedisPubSubBase implements IRedisPubSubEmitter {
  public constructor(
    scope: string,
    private readonly sender: RedisClient,
    errorHandler: (err: unknown) => void,
    parentLog: Logger,
  ) {
    super(scope, parentLog)

    sender.on('error', (err) => {
      this.log.error({ err }, 'Redis pub client error!')
      errorHandler(err)
    })
  }

  public emit<T>(channel: string, data: T) {
    this.log.debug({ channel: `${this.prefix}${channel}`, data }, 'Emitting Redis Pub/Sub message!')
    this.sender.publish(`${this.prefix}${channel}`, JSON.stringify(data))
  }
}

export class RedisPubSubBus extends RedisPubSubBase implements IRedisPubSubBus {
  private readonly emitter: IRedisPubSubEmitter

  private readonly receiver: IRedisPubSubReceiver

  public constructor(
    scope: string,
    redisPair: IRedisPubSubPair,
    errorHandler: (err: unknown) => void,
    parentLog: Logger,
  ) {
    super(scope, parentLog)

    this.emitter = new RedisPubSubEmitter(scope, redisPair.pubClient, errorHandler, this.log)
    this.receiver = new RedisPubSubReceiver(scope, redisPair.subClient, errorHandler, this.log)
  }

  public emit<T>(channel: string, data: T) {
    this.emitter.emit(channel, data)
  }

  public subscribe<T>(channel: string, listener: (data: T) => Promise<void>): string {
    return this.receiver.subscribe(channel, listener)
  }

  public unsubscribe(id: string) {
    this.receiver.unsubscribe(id)
  }
}
