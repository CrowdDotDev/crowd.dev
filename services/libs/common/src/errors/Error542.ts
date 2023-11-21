export default class Error542 extends Error {
  code: number

  constructor(message?) {
    message = message || 'Internal server error'
    super(message)
    this.code = 542
  }
}
