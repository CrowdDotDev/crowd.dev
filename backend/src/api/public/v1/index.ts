import { Router } from 'express'

import getHealth from './health'

export function v1Router(): Router {
  const router = Router()

  router.get('/health', getHealth)

  return router
}
