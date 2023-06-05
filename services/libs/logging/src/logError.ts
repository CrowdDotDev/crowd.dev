import { Logger } from './types'

export const logError = (log: Logger, error: Error): Error => {
  log.error(error, `Error: ${error.message}`)
  return error
}
