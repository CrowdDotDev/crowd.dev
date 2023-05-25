export class BaseError extends Error {
  public name: string

  public message: string

  public stack?: string

  public originalError?: unknown

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    this.originalError = originalError
    Error.captureStackTrace(this, this.constructor)
    Object.setPrototypeOf(this, BaseError.prototype)
  }
}

export class RateLimitError extends BaseError {
  public rateLimitResetSeconds: number

  constructor(rateLimitResetSeconds: number, endpoint: string, origError?: unknown) {
    super(`Endpoint: '${endpoint}' rate limit exceeded`, origError)
    this.rateLimitResetSeconds = rateLimitResetSeconds
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}
