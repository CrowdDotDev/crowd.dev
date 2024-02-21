import { Logger } from './types'
import { performance } from 'perf_hooks'

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
  toExecute: () => Promise<T>,
  log: Logger,
  name: string,
): Promise<T> => {
  if (process.env['LOG_EXEC_TIME_ENABLED']) {
    const start = performance.now()

    const end = () => {
      const end = performance.now()
      const duration = end - start
      const durationInSeconds = duration / 1000
      return durationInSeconds.toFixed(2)
    }
    try {
      const result = await toExecute()
      log.info(`Process ${name} took ${end()} seconds!`)
      return result
    } catch (e) {
      log.info(`Process ${name} failed after ${end()} seconds!`)
      throw e
    }
  } else {
    return toExecute()
  }
}
