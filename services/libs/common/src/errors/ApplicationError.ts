export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}
