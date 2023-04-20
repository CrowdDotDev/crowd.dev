import moment from 'moment'
import { Logger } from './logging'

export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })

export const getSecondsTillEndOfMonth = () => {
  const endTime = moment().endOf('month')
  const startTime = moment()

  return endTime.diff(startTime, 'seconds')
}

export const timeExecution = async <T>(
  fn: () => Promise<T>,
  logger: Logger,
  job: string,
): Promise<T> => {
  logger.debug(`Starting timing of: ${job}...`)
  const startTime = moment()
  try {
    const result = await fn()
    return result
  } finally {
    const endTime = moment()
    const duration = moment.duration(endTime.diff(startTime))
    logger.debug({ duration: duration.asMilliseconds() }, `Finished timing of: ${job}...`)
  }
}
