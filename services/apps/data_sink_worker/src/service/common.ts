export class UnrepeatableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnrepeatableError'
  }
}
