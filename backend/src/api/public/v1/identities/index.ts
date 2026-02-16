import { Router } from 'express'

import { requireScopes } from '@/api/public/middlewares/requireScopes'

import { getIdentities } from './getIdentities'
import { safeWrap } from '@/middlewares/errorMiddleware'

export function identitiesRouter(): Router {
  const router = Router()

  router.get('/', requireScopes(['read:identities']), safeWrap(getIdentities))

  return router
}
