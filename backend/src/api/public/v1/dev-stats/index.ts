import { Router } from 'express'

export function devStatsRouter(): Router {
  const router = Router()

  router.post('/affiliations', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return router
}
