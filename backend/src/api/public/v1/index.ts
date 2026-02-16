import { Router } from 'express'

import { identitiesRouter } from './identities'

export function v1Router(): Router {
  const router = Router()

  router.use('/identities', identitiesRouter())

  return router
}
