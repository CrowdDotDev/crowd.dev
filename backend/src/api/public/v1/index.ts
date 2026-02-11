import type { RequestHandler } from 'express'
import { Router } from 'express'

import health from './health'

export function createV1Router(): Router {
  const router = Router()

  router.get('/health', health as RequestHandler)

  return router
}
