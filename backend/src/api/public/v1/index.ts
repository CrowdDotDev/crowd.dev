import { Router } from 'express'

import { membersRouter } from './members'

export function v1Router(): Router {
  const router = Router()

  router.use('/members', membersRouter())

  return router
}
