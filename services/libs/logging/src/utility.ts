import { performance } from 'perf_hooks'

import { Logger } from './types'

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
    if (process.env.CROWD_LOG_EXECUTION_START) {
      log.info(`Starting process ${name}...`)
    }

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
