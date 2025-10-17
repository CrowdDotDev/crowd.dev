import { Logger } from '@crowd/logging'
import { RateLimitError } from '@crowd/types'

const getHeader = (
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined => {
  if (!headers) return undefined

  if (headers[name]) return headers[name]

  const lowerName = name.toLowerCase()
  if (headers[lowerName]) return headers[lowerName]

  const headerKey = Object.keys(headers).find((key) => key.toLowerCase() === lowerName)
  return headerKey ? headers[headerKey] : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleGitlabError = (err: any, endpoint: string, logger: Logger) => {
  // we get no headers in this case, so we need to handle it differently
  if (
    err &&
    err.message ===
      'Could not successfully complete this request due to Error 429. Check the applicable rate limits for this endpoint.'
  ) {
    // return a random amount of seconds between 1 minute and 10 minutes
    return new RateLimitError(Math.floor(Math.random() * 540) + 60, endpoint, err)
  }

  // Check if this is a rate limit error (429)
  if (err && err.response && err.response.status === 429) {
    logger.warn('GitLab API rate limit exceeded')
    let rateLimitResetSeconds = 60 // Default to 60 seconds if no header is present

    // https://docs.gitlab.com/administration/settings/user_and_ip_rate_limits/#use-a-custom-rate-limit-response

    // Retry-After header in seconds
    const retryAfter = getHeader(err.response.headers, 'retry-after')
    if (retryAfter) {
      rateLimitResetSeconds = parseInt(retryAfter, 10)
    }
    // RateLimit-Reset header (Unix timestamp)
    else {
      const rateLimitReset = getHeader(err.response.headers, 'ratelimit-reset')
      if (rateLimitReset) {
        const resetTimestamp = parseInt(rateLimitReset, 10)
        const now = Math.floor(Date.now() / 1000)
        rateLimitResetSeconds = Math.max(resetTimestamp - now, 0) + 5 // Add 5 second buffer
      }
    }

    logger.warn(
      {
        rateLimitResetSeconds,
        endpoint,
        remainingRequests: getHeader(err.response.headers, 'ratelimit-remaining'),
        resetTime: getHeader(err.response.headers, 'ratelimit-reset'),
      },
      'Rate limit details',
    )

    return new RateLimitError(rateLimitResetSeconds, endpoint, err)
  }

  // Check if this is a 403 error which can also indicate rate limiting
  if (err && err.response && err.response.status === 403) {
    const errorMessage = err.response.data?.message || err.message || ''
    if (errorMessage.toLowerCase().includes('rate limit')) {
      logger.warn('GitLab API rate limit exceeded (403)')
      let rateLimitResetSeconds = 60

      const retryAfter = getHeader(err.response.headers, 'retry-after')
      if (retryAfter) {
        rateLimitResetSeconds = parseInt(retryAfter, 10)
      } else {
        const rateLimitReset = getHeader(err.response.headers, 'ratelimit-reset')
        if (rateLimitReset) {
          const resetTimestamp = parseInt(rateLimitReset, 10)
          const now = Math.floor(Date.now() / 1000)
          rateLimitResetSeconds = Math.max(resetTimestamp - now, 0) + 5
        }
      }

      return new RateLimitError(rateLimitResetSeconds, endpoint, err)
    }
  }

  logger.error(err, `Error while calling GitLab API endpoint: ${endpoint}`)
  return err
}

export const isApproachingRateLimit = (
  headers: Record<string, string> | undefined,
  threshold = 10,
): boolean => {
  if (!headers) return false

  const remaining = getHeader(headers, 'ratelimit-remaining')
  if (remaining) {
    const remainingCount = parseInt(remaining, 10)
    return remainingCount <= threshold
  }

  return false
}

export const getRateLimitInfo = (headers: Record<string, string> | undefined) => {
  if (!headers) return null

  const limit = getHeader(headers, 'ratelimit-limit')
  const remaining = getHeader(headers, 'ratelimit-remaining')
  const reset = getHeader(headers, 'ratelimit-reset')

  return {
    limit: limit ? parseInt(limit, 10) : null,
    remaining: remaining ? parseInt(remaining, 10) : null,
    reset: reset ? parseInt(reset, 10) : null,
    resetDate: reset ? new Date(parseInt(reset, 10) * 1000) : null,
  }
}
