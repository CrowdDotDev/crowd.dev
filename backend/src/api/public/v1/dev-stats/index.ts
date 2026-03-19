import { Router } from 'express'

import { createRateLimiter } from '@/api/apiRateLimiter'

const rateLimiter = createRateLimiter({ max: 60, windowMs: 60 * 1000 })

export function devStatsRouter(): Router {
  const router = Router()

  router.use(rateLimiter)

  router.post('/affiliations', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return router
}
