import { AxiosError, AxiosRequestConfig } from 'axios'
import { RateLimitError } from '@crowd/types'
import { IProcessStreamContext } from '../../../types'

export const handleRedditError = (
  err: AxiosError,
  config: AxiosRequestConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  ctx: IProcessStreamContext,
) => {
  const logger = ctx.log

  let url = config.url
  if (config.params) {
    const queryParams: string[] = []
    for (const [key, value] of Object.entries(config.params)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryParams.push(`${key}=${encodeURIComponent(value as any)}`)
    }

    url = `${config.url}?${queryParams.join('&')}`
  }

  if (err && err.response && err.response.status === 429) {
    logger.warn('Reddit API rate limit exceeded')
    let rateLimitResetSeconds = 60

    if (err.response.headers['x-ratelimit-reset']) {
      rateLimitResetSeconds = parseInt(err.response.headers['x-ratelimit-reset'], 10)
    }

    return new RateLimitError(rateLimitResetSeconds, url, err)
  }

  logger.error(err, { input }, `Error while calling Reddit API URL: ${url}`)
  return err
}
