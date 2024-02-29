import { LOG_EXECUTION_TIME } from '@crowd/common'
import { Logger } from './types'
import { performance } from 'perf_hooks'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const logExecutionTime = async <T>(
  toExecute: () => Promise<T>,
  log: Logger,
  name: string,
): Promise<T> => {
  if (!LOG_EXECUTION_TIME) {
    return toExecute()
  }

  const start = performance.now()
  try {
    log.info(`Starting timing process ${name}...`)
    return await toExecute()
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
  if (!LOG_EXECUTION_TIME) {
    return toExecute()
  }
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
}
