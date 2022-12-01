import { BaseError } from '../baseError'

export class RateLimitError extends BaseError {
  public rateLimitResetSeconds: number

  constructor(rateLimitResetSeconds: number, endpoint: string, origError?: any) {
    super(`Endpoint: '${endpoint}' rate limit exceeded`, origError)
    this.rateLimitResetSeconds = rateLimitResetSeconds
  }
}
