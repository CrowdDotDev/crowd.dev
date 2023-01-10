import { v4 as uuid } from 'uuid'
import { IRedisPubSubReceiver, RedisClient } from './index'
import RedisPubSubBase from './pubSub'

type MessageHandler = (msg: any) => Promise<void>

interface MessageHandlerInfo {
  id: string
  handler: MessageHandler
}

export default class RedisPubSubReceiver extends RedisPubSubBase implements IRedisPubSubReceiver {
  private subscriptionMap: Map<string, MessageHandlerInfo[]> = new Map()

  public constructor(
    scope: string,
    private readonly receiver: RedisClient,
    errorHandler: (err: any) => void,
  ) {
    super(scope)

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

  public subscribe(channel: string, handler: (data: any) => Promise<void>): string {
    const id = uuid()

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
