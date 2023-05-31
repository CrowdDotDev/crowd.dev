import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'
import { AxiosError, AxiosRequestConfig } from 'axios'

export const handleLinkedinError = (
  err: AxiosError,
  config: AxiosRequestConfig<unknown>,
  input: unknown,
  logger: Logger,
) => {
  const queryParams: string[] = []
  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      queryParams.push(`${key}=${encodeURIComponent(value as string)}`)
    }
  }

  const url = `${config.url}?${queryParams.join('&')}`

  // https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits
  if (err && err.response && err.response.status === 429) {
    logger.warn('LinkedIn API rate limit exceeded')
    // we don't get information about when it resets because it resets every day at midnight (UTC)
    const now = new Date()
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    nextDay.setHours(0, 5, 0, 0)

    const milisecondsToNextMidnight = nextDay.getTime() - now.getTime()
    const rateLimitResetSeconds = milisecondsToNextMidnight / 1000

    return new RateLimitError(rateLimitResetSeconds, url, err)
  }
  logger.error(err, { input }, `Error while calling LinkedIn API URL: ${url}`)
  return err
}
