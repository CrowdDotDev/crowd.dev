import { getChildLogger, getServiceChildLogger } from './logger'
import { Logger } from './types'

export abstract class LoggerBase {
  protected log: Logger

  protected constructor()
  protected constructor(logProperties: Record<string, unknown>)
  protected constructor(parentLog: Logger)
  protected constructor(parentLog: Logger, logProperties: Record<string, unknown>)
  protected constructor(
    logOrProperties?: Logger | Record<string, unknown>,
    logProperties?: Record<string, unknown>,
  ) {
    if (typeof logOrProperties === 'undefined') {
      this.log = getServiceChildLogger(this.constructor.name)
    } else {
      const results = ['trace', 'info', 'debug', 'warn', 'fatal']
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((method) => typeof (logOrProperties as any)[method])
        .filter((r) => r !== 'function')

      if (results.length > 0) {
        // not Logger
        this.log = getServiceChildLogger(
          this.constructor.name,
          logOrProperties as Record<string, unknown>,
        )
      } else {
        // ILogger
        this.log = getChildLogger(this.constructor.name, logOrProperties as Logger, logProperties)
      }
    }
  }
}
