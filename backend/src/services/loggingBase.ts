import { createChildLogger, Logger, getServiceLogger } from '../utils/logging'
import { IServiceOptions } from './IServiceOptions'

export abstract class LoggingBase {
  protected readonly log: Logger

  protected constructor(options?: IServiceOptions, logProps?: any, childName?: string) {
    const originalLogger = options?.log || getServiceLogger()
    const actualLogProps = logProps || {}
    const name = childName ?? this.constructor.name

    this.log = createChildLogger(name, originalLogger, actualLogProps)
  }
}
