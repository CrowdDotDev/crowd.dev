import { Router } from 'express'

import { AUTH0_CONFIG } from '../../conf'

import { errorHandler } from './middlewares/errorHandler'
import { oauth2Middleware } from './middlewares/oauth2Middleware'
import { v1Router } from './v1'

export function publicRouter(): Router {
  const router = Router()

  router.use('/v1', oauth2Middleware(AUTH0_CONFIG), v1Router())
  router.use(errorHandler)

  return router
}
