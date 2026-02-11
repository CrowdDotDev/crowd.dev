import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { auth } from 'express-oauth2-jwt-bearer'
import type { JWTPayload } from 'express-oauth2-jwt-bearer'

import type { Auth0Configuration } from '../../conf/configTypes'
import { ApiError, ApiErrorCode } from '../../types/middleware'
import type { ApiRequest } from '../../types/middleware'

interface Auth0TokenPayload extends JWTPayload {
  azp?: string
  scope?: string
}

function resolveCaller(req: Request, _res: Response, next: NextFunction): void {
  const payload = (req.auth?.payload ?? {}) as Auth0TokenPayload

  const id = payload.sub ?? payload.azp
  if (!id) {
    next(new ApiError(ApiErrorCode.UNAUTHORIZED, 'Token missing caller identity'))
    return
  }

  const apiReq = req as ApiRequest
  apiReq.caller = {
    id,
    type: 'machine',
    scopes: typeof payload.scope === 'string'
      ? payload.scope.split(' ').filter(Boolean)
      : [],
  }

  next()
}

export function createOAuth2Auth(config: Auth0Configuration): Router {
  if (!config?.issuerBaseURL || !config?.audience) {
    throw new Error('Missing Auth0 config: issuerBaseURL and audience are required!')
  }

  const router = Router()

  router.use(
    auth({
      issuerBaseURL: config.issuerBaseURL,
      audience: config.audience,
    }),
  )

  router.use(resolveCaller)

  return router
}
