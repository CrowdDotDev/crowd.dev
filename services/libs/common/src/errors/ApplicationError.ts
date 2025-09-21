export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}
