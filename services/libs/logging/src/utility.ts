import { performance } from 'perf_hooks'

import { Logger } from './types'

/* eslint-disable @typescript-eslint/ban-types */

export const logExecutionTime = async <T>(
  process: () => Promise<T>,
  log: Logger,
  name: string,
): Promise<T> => {
  const start = performance.now()
  try {
    log.info(`Starting timing process ${name}...`)
    return await process()
  } finally {
    const end = performance.now()
    const duration = end - start
    const durationInSeconds = duration / 1000
    log.info(`Process ${name} took ${durationInSeconds.toFixed(2)} seconds!`)
  }
}

export const logExecutionTimeV2 = async <T>(
  toProcess: () => Promise<T>,
  log: Logger,
  name: string,
): Promise<T> => {
  if (!process.env.CROWD_LOG_EXECUTION_TIME) {
    return toProcess()
  }

  const start = performance.now()

  const end = () => {
    const end = performance.now()
    const duration = end - start
    const durationInSeconds = duration / 1000
    return durationInSeconds.toFixed(2)
  }
  try {
    const result = await toProcess()
    log.info(`Process ${name} took ${end()} seconds!`)
    return result
  } catch (e) {
    log.info(`Process ${name} failed after ${end()} seconds!`)
    throw e
  }
}

export const timer = (log: Logger, name?: string) => {
  const start = performance.now()
  let isEnded = false
  return {
    end: function (overrideName?: string) {
      if (isEnded) {
        return
      }
      isEnded = true

      const end = performance.now()
      const duration = end - start
      const durationInSeconds = duration / 1000
      log.info(`Process ${overrideName ?? name} took ${durationInSeconds.toFixed(2)} seconds!`)
    },
  }
}

export function measureTime(level = 'info') {
  // Early return if environment variable isn't set
  if (!process.env.CROWD_METHOD_EXECUTION_TRACE) {
    // Return a pass-through decorator that does nothing
    return function (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) {
      return descriptor // Just return the original descriptor unchanged
    }
  }

  // Only execute timing logic if the env variable is set
  return function (_target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      // Try to get a logger
      const thisObj = this as Record<string, unknown>
      const log = thisObj.log
      const logger = thisObj.logger

      // Find a usable logger
      const loggingObj =
        log &&
        typeof log === 'object' &&
        level in log &&
        typeof (log as Record<string, unknown>)[level] === 'function'
          ? (log as Record<string, Function>)
          : logger &&
              typeof logger === 'object' &&
              level in logger &&
              typeof (logger as Record<string, unknown>)[level] === 'function'
            ? (logger as Record<string, Function>)
            : null

      const start = performance.now()
      const result = originalMethod.apply(this, args)

      // If no logger is available, just return the result
      if (!loggingObj) {
        return result
      }

      // Handle async vs sync
      if (result instanceof Promise) {
        return result
          .then((value: unknown) => {
            const end = performance.now()
            loggingObj[level](`Async ${propertyKey} executed in ${end - start}ms`)
            return value
          })
          .catch((error: unknown) => {
            const end = performance.now()
            loggingObj[level](`Async ${propertyKey} failed after ${end - start}ms`)
            throw error
          })
      } else {
        const end = performance.now()
        loggingObj[level](`${propertyKey} executed in ${end - start}ms`)
        return result
      }
    }

    return descriptor
  }
}
