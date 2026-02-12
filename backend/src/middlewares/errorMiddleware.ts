import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'
import {
  InsufficientScopeError as Auth0InsufficientScopeError,
  UnauthorizedError as Auth0UnauthorizedError,
} from 'express-oauth2-jwt-bearer'

import { HttpError, InsufficientScopeError, InternalError, UnauthorizedError } from '@crowd/common'

/**
 * Legacy API error handler for internal routes.
 * Delegates to `req.responseHandler` (used by CDP frontend routes).
 */
export async function errorMiddleware(error, req, res, _next) {
  await req.responseHandler.error(req, res, error)
}

export const safeWrap =
  (handler: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await handler(req, res, next)
    } catch (err) {
      next(err)
    }
  }

/**
 * Converts errors to structured JSON: `{ error: { code, message } }`.
 * Defaults to 500 Internal Error for unhandled errors.
 */
export const errorMiddlewareV2: ErrorRequestHandler = (
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

  const httpErr = new InternalError()
  res.status(httpErr.status).json(httpErr.toJSON())
}
