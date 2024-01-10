export abstract class HttpStatusError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    Object.setPrototypeOf(this, HttpStatusError.prototype)
  }
}

export class Error400BadRequest extends HttpStatusError {
  constructor(message: string) {
    super(message, 400)
    Object.setPrototypeOf(this, Error400BadRequest.prototype)
  }
}

export class Error401Unauthorized extends HttpStatusError {
  constructor(message: string) {
    super(message, 401)
    Object.setPrototypeOf(this, Error401Unauthorized.prototype)
  }
}

export class Error404NotFound extends HttpStatusError {
  constructor(message: string) {
    super(message, 404)
    Object.setPrototypeOf(this, Error404NotFound.prototype)
  }
}

export class Error500InternalServerError extends HttpStatusError {
  constructor(message: string) {
    super(message, 500)
    Object.setPrototypeOf(this, Error500InternalServerError.prototype)
  }
}
