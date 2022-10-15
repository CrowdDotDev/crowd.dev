import { createChildLogger, Logger } from './logging'

export abstract class ServiceBase {
  protected readonly log: Logger

  protected constructor(parentLogger: Logger, logProperties?: any) {
    this.log = createChildLogger(parentLogger, this.constructor.name, logProperties)
  }
}
