import { LogLevel as TemporalLogLevel, Logger as TemporalLogger } from '@temporalio/worker'

import { LogLevel, Logger } from '@crowd/logging'

export function createTemporalLogger(base: Logger): TemporalLogger {
  return {
    log(level: TemporalLogLevel, message: string, meta?: Record<string, unknown>) {
      const bunyanLevel = {
        ['TRACE']: 'trace',
        ['DEBUG']: 'debug',
        ['INFO']: 'info',
        ['WARN']: 'warn',
        ['ERROR']: 'error',
      }[level] as LogLevel

      if (meta) {
        base[bunyanLevel](meta, message)
      } else {
        base[bunyanLevel](message)
      }
    },

    // Map Temporal log levels to Bunyan levels
    trace(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.trace(meta, message)
      } else {
        base.trace(message)
      }
    },

    debug(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.debug(meta, message)
      } else {
        base.debug(message)
      }
    },

    info(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.info(meta, message)
      } else {
        base.info(message)
      }
    },

    warn(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.warn(meta, message)
      } else {
        base.warn(message)
      }
    },

    error(message: string, meta?: Record<string, unknown>) {
      if (meta) {
        base.error(meta, message)
      } else {
        base.error(message)
      }
    },
  }
}
