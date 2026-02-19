import type { Request, Response } from 'express'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { RateLimitError } from '@crowd/common'

import { AUTH0_CONFIG } from '../../conf'

import { errorHandler } from './middlewares/errorHandler'
import { oauth2Middleware } from './middlewares/oauth2Middleware'
import { v1Router } from './v1'

const rateLimiter = rateLimit({
  max: 300,
  windowMs: 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    const err = new RateLimitError()
    res.status(err.status).json(err.toJSON())
  },
})

export function publicRouter(): Router {
  const router = Router()

  router.use(rateLimiter)
  
  router.use(oauth2Middleware(AUTH0_CONFIG))
  router.use('/v1', v1Router())
  router.use(errorHandler)

  return router
}
