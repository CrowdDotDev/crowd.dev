import { AxiosError } from 'axios'
import { RateLimitError } from '../../../../types/integration/rateLimitError'
import { Logger } from '../../../../utils/logging'

export const handleSlackError = (err: AxiosError, input: any, logger: Logger): any => {
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

  // https://api.slack.com/docs/rate-limits
  if (err && err.response && err.response.status === 429) {
    logger.warn('Slack API rate limit exceeded')
    let rateLimitResetSeconds = 60

    if (err.response.headers['Retry-After']) {
      rateLimitResetSeconds = parseInt(err.response.headers['Retry-After'], 10)
    }

    return new RateLimitError(rateLimitResetSeconds, url, err)
  }
  logger.error({ err, input }, `Error while calling Slack API URL: ${url}`)
  return err
}
