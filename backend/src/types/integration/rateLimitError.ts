import { BaseError } from '../baseError'

export class RateLimitError extends BaseError {
  public rateLimitResetSeconds: number

  constructor(rateLimitResetSeconds: number, endpoint: string) {
    super(`Endpoint: '${endpoint}' rate limit exceeded`)
    this.rateLimitResetSeconds = rateLimitResetSeconds
  }
}
