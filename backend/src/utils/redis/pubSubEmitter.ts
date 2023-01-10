import RedisPubSubBase from './pubSub'
import { IRedisPubSubEmitter, RedisClient } from './index'

export default class RedisPubSubEmitter extends RedisPubSubBase implements IRedisPubSubEmitter {
  public constructor(
    scope: string,
    private readonly sender: RedisClient,
    errorHandler: (err: any) => void,
  ) {
    super(scope)

    sender.on('error', (err) => {
      this.log.error({ err }, 'Redis pub client error!')
      errorHandler(err)
    })
  }

  public emit(channel: string, data: any) {
    this.log.debug({ channel: `${this.prefix}${channel}`, data }, 'Emitting Redis Pub/Sub message!')
    this.sender.publish(`${this.prefix}${channel}`, JSON.stringify(data))
  }
}
