import { AxiosError, AxiosRequestConfig } from 'axios'
import moment from 'moment'
import { Logger } from '@crowd/logging'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

export const handleLinkedinError = (
  err: AxiosError,
  config: AxiosRequestConfig<any>,
  input: any,
  logger: Logger,
): any => {
  const queryParams: string[] = []
  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      queryParams.push(`${key}=${encodeURIComponent(value as any)}`)
    }
  }

  const url = `${config.url}?${queryParams.join('&')}`

  // https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits
  if (err && err.response && err.response.status === 429) {
    logger.warn('LinkedIn API rate limit exceeded')
    // we don't get information about when it resets because it resets every day at midnight (UTC)
    const now = moment().utcOffset(0)
    const nextMidnight = moment().utcOffset(0).add(1, 'day').startOf('day')

    const rateLimitResetSeconds = nextMidnight.diff(now, 'seconds')
    return new RateLimitError(rateLimitResetSeconds, url, err)
  }
  logger.error(err, { input }, `Error while calling LinkedIn API URL: ${url}`)
  return err
}
