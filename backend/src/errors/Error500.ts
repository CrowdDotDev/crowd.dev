export default class Error500 extends Error {
  code: Number

  constructor(message?) {
    message = message || 'Internal server error'
    super(message)
    this.code = 500
  }
}
