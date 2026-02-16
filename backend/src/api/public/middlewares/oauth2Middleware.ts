import type { NextFunction, Request, Response, RequestHandler } from 'express'
import { auth } from 'express-oauth2-jwt-bearer'
import type { JWTPayload } from 'express-oauth2-jwt-bearer'

import { UnauthorizedError } from '@crowd/common'

import type { Auth0Configuration } from '@/conf/configTypes'
import type { ApiRequest } from '@/types/api'

interface Auth0TokenPayload extends JWTPayload {
  azp?: string
  scope?: string
}

function resolveActor(req: Request, _res: Response, next: NextFunction): void {
  const payload = (req.auth?.payload ?? {}) as Auth0TokenPayload

  const id = payload.sub ?? payload.azp
  if (!id) {
    next(new UnauthorizedError('Token missing caller identity'))
    return
  }

  const authReq = req as ApiRequest

  const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ').filter(Boolean) : []

  authReq.actor = { id, type: 'service', scopes }

  next()
}

export function oauth2Middleware(config: Auth0Configuration): RequestHandler[] {
  if (!config?.issuerBaseURL || !config?.audience) {
    throw new Error('Missing Auth0 config')
  }

  return [
    auth({
      issuerBaseURL: config.issuerBaseURL,
      audience: config.audience,
    }),
    resolveActor,
  ]
}
