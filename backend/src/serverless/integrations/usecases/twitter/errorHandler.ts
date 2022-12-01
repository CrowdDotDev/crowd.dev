import { AxiosError } from 'axios'
import { RateLimitError } from '../../../../types/integration/rateLimitError'
import { Logger } from '../../../../utils/logging'

export const handleTwitterError = (err: AxiosError, input: any, logger: Logger): any => {
  let url = ''
  if (err.config) {
    const queryParams: string[] = []
    if (err.config.params) {
      for (const [key, value] of Object.entries(err.config.params)) {
        queryParams.push(`${key}=${encodeURIComponent(value as any)}`)
      }
    }

    url = `${err.config.url}?${queryParams.join('&')}`
  } else if (err.request) {
    url = `${err.request.host}${err.request.path}`
  } else {
    url = 'unknown-url'
  }

  // https://developer.twitter.com/en/docs/twitter-api/rate-limits
  if (err && err.response && err.response.status === 429) {
    logger.warn('Twitter API rate limit exceeded')
    let rateLimitResetSeconds = 60

    if (err.response.headers['x-rate-limit-reset']) {
      rateLimitResetSeconds = parseInt(err.response.headers['x-rate-limit-reset'], 10)
    }

    throw new RateLimitError(rateLimitResetSeconds, url, err)
  } else {
    logger.error({ err, input }, `Error while calling Twitter API URL: ${url}`)
    throw err
  }
}
