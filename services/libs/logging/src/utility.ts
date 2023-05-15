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
