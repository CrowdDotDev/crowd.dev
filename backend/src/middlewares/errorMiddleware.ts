import type { ErrorRequestHandler, RequestHandler } from 'express'
import { InsufficientScopeError, UnauthorizedError } from 'express-oauth2-jwt-bearer'

import { ApiError, ApiErrorCode, ERROR_CODE_TO_STATUS } from '../types/middleware'

/**
 * Legacy internal API error middleware.
 * Used by CDP frontend-facing routes via req.responseHandler.
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
 * Structured error middleware for the newer public API surface.
 * Long-term direction: migrate internal routes to this pattern and retire
 * the legacy `errorMiddleware` once the migration is complete.
 */
export const errorMiddlewareV2: ErrorRequestHandler = (err, _req, res, _next) => {
  let code: ApiErrorCode
  let message: string

  if (err instanceof ApiError) {
    // Custom application errors
    code = err.code
    message = err.message
  } else if (err instanceof InsufficientScopeError) {
    code = ApiErrorCode.INSUFFICIENT_SCOPE
    message = err.message || 'Insufficient scope for this operation'
  } else if (err instanceof UnauthorizedError) {
    code = ApiErrorCode.UNAUTHORIZED
    message = err.message || 'Invalid or expired access token'
  } else {
    // Fallback for unexpected errors
    code = ApiErrorCode.INTERNAL_ERROR
    message = err instanceof Error && err.message ? err.message : 'Internal server error'

    // For security, hide message for server errors (5xx)
    const status = ERROR_CODE_TO_STATUS[code] || 500
    if (status >= 500) message = 'Internal server error'
  }

  const status = ERROR_CODE_TO_STATUS[code] || 500

  res.status(status).json({ error: { code, message } })
}
