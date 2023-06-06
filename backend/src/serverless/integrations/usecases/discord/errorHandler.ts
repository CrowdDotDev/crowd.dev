import { AxiosError, AxiosRequestConfig } from 'axios'
import { Logger } from '@crowd/logging'
import { RateLimitError } from '../../../../types/integration/rateLimitError'

export const handleDiscordError = (
  err: AxiosError,
  config: AxiosRequestConfig<any>,
  input: any,
  logger: Logger,
): any => {
  let url = config.url
  if (config.params) {
    const queryParams: string[] = []
    for (const [key, value] of Object.entries(config.params)) {
      queryParams.push(`${key}=${encodeURIComponent(value as any)}`)
    }

    url = `${config.url}?${queryParams.join('&')}`
  }

  if (err && err.response && err.response.status === 429) {
    logger.warn('Discord API rate limit exceeded')
    let rateLimitResetSeconds = 60

    if (err.response.headers['x-ratelimit-reset-after']) {
      rateLimitResetSeconds = parseInt(err.response.headers['x-ratelimit-reset-after'], 10)
    }

    return new RateLimitError(rateLimitResetSeconds, url, err)
  }
  logger.error(err, { input }, `Error while calling Slack API URL: ${url}`)
  return err
}
