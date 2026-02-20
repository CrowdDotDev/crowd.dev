import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import {
  InsufficientScopeError as Auth0InsufficientScopeError,
  UnauthorizedError as Auth0UnauthorizedError,
} from 'express-oauth2-jwt-bearer'

import { HttpError, InsufficientScopeError, InternalError, UnauthorizedError } from '@crowd/common'

/**
 * Converts errors to structured JSON: `{ error: { code, message } }`.
 * Defaults to 500 Internal Error for unhandled errors.
 */
export const errorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof HttpError) {
    res.status(error.status).json(error.toJSON())
    return
  }

  if (error instanceof Auth0InsufficientScopeError) {
    const httpErr = new InsufficientScopeError(error.message || undefined)
    res.status(httpErr.status).json(httpErr.toJSON())
    return
  }

  if (error instanceof Auth0UnauthorizedError) {
    const httpErr = new UnauthorizedError(error.message || undefined)
    res.status(httpErr.status).json(httpErr.toJSON())
    return
  }

  const unknownError = new InternalError()
  res.status(unknownError.status).json(unknownError.toJSON())
}
