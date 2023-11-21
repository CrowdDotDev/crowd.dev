import { AxiosError, AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'

export const handleTwitterError = (
  err: AxiosError,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: AxiosRequestConfig<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  logger: Logger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  const queryParams: string[] = []
  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryParams.push(`${key}=${encodeURIComponent(value as any)}`)
    }
  }

  const url = `${config.url}?${queryParams.join('&')}`

  // https://developer.twitter.com/en/docs/twitter-api/rate-limits
  if (err && err.response && err.response.status === 429) {
    logger.warn('Twitter API rate limit exceeded')
    let rateLimitResetSeconds = 60

    if (err.response.headers['x-rate-limit-reset']) {
      rateLimitResetSeconds = parseInt(err.response.headers['x-rate-limit-reset'], 10)
    }

    throw new RateLimitError(rateLimitResetSeconds, url, err)
  } else {
    logger.error(err, { input }, `Error while calling Twitter API URL: ${url}`)
    throw err
  }
}
