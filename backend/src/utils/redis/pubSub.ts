import { createServiceChildLogger, Logger } from '../logging'

const log = createServiceChildLogger('redis/pubSub')

export default abstract class RedisPubSubBase {
  protected readonly log: Logger

  protected readonly prefix: string

  protected constructor(scope: string) {
    this.log = log.child({ scope }, true)
    this.prefix = `${scope}:`
  }
}
