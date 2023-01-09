import { IRedisPubSubPair } from './index'
import { createServiceChildLogger, Logger } from '../logging'

const log = createServiceChildLogger('redis/pubSub')

export class RedisPubSub {
  protected readonly log: Logger

  protected readonly prefix: string

  private subscriptionMap: Map<string, (msg: any) => Promise<void>> = new Map()

  protected constructor(
    public readonly scope: string,
    protected readonly redisPubSubPair: IRedisPubSubPair,
    errorHandler: (err: any) => void,
  ) {
    this.log = log.child({ scope }, true)
    this.prefix = `${scope}:`

    redisPubSubPair.pubClient.on('error', (err) => {
      this.log.error({ err }, 'Redis pub client error!')
      errorHandler(err)
    })

    redisPubSubPair.subClient.on('error', (err) => {
      this.log.error({ err }, 'Redis sub client error!')
      errorHandler(err)
    })

    redisPubSubPair.subClient.pSubscribe(`${this.prefix}*`, (err) => {})
  }
}
