import { Router } from 'express'

import { AUTH0_CONFIG } from '../../conf'
import { createOAuth2Auth } from '../../middlewares/auth/oauth2.middleware'
import { errorMiddlewareV2 } from '../../middlewares/error.middleware'

import { createV1Router } from './v1'

export function createPublicRouter(): Router {
  const router = Router()

  router.use(createOAuth2Auth(AUTH0_CONFIG))
  router.use('/v1', createV1Router())
  router.use(errorMiddlewareV2)

  return router
}
