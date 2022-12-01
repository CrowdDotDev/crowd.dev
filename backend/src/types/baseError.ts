export class BaseError extends Error {
  public name: string

  public message: string

  public stack?: string

  public originalError?: any

  constructor(message: string, originalError?: any) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    this.originalError = originalError
    Error.captureStackTrace(this, this.constructor)
  }
}
