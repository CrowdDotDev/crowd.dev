import type { NextFunction, Request, Response } from 'express'
import { Error401 } from '@crowd/common'

import AuthService from '../../services/auth/authService'

/**
 * Extracts the session token from the request.
 * Checks: bearer header → cookie → query param.
 */
function extractToken(req: Request): string | null {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split('Bearer ')[1]
  }

  if (req.cookies?.__session) {
    return req.cookies.__session
  }

  if (req.query?.crowdToken) {
    return req.query.crowdToken as string
  }

  return null
}

/**
 * Resolves the CDP user from a session token and attaches
 * it to `req.currentUser`. Permissive: if no token is present,
 * the request continues without a user — route handlers enforce
 * auth where needed.
 */
export async function sessionAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    if (!token) return next()

    req.currentUser = await AuthService.findByToken(token, req)
    return next()
  } catch (error) {
    req.log.error(error, 'Error while finding user')
    return next(new Error401())
  }
}