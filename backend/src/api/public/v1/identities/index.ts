import { Router } from 'express'

import { requireScopes } from '@/api/public/middlewares/requireScopes'

import { getIdentities } from './getIdentities'

export function identitiesRouter(): Router {
  const router = Router()

  router.get('/', requireScopes(['read:identities']), getIdentities)

  return router
}
