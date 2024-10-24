import { AxiosError, AxiosRequestConfig } from 'axios'

import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'

import { SlackGetChannelsInput, SlackGetMembersInput, SlackGetMessagesInput } from '../types'

export const handleSlackError = (
  err: AxiosError,
  config: AxiosRequestConfig,
  input: SlackGetMessagesInput | SlackGetChannelsInput | SlackGetMembersInput,
  logger: Logger,
) => {
  const queryParams: string[] = []
  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      queryParams.push(`${key}=${encodeURIComponent(value as string)}`)
    }
  }

  const url = `${config.url}?${queryParams.join('&')}`

  // https://api.slack.com/docs/rate-limits
  if (err && err.response && err.response.status === 429) {
    logger.warn('Slack API rate limit exceeded')
    let rateLimitResetSeconds = 60

    if (err.response.headers['Retry-After']) {
      rateLimitResetSeconds = parseInt(err.response.headers['Retry-After'], 10)
    }

    return new RateLimitError(rateLimitResetSeconds, url, err)
  }
  logger.error(err, { input }, `Error while calling Slack API URL: ${url}`)
  return err
}
