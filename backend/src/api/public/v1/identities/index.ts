import { Router } from 'express'

import { requireScopes } from '@/api/public/middlewares/requireScopes'
import { safeWrap } from '@/middlewares/errorMiddleware'
import { SCOPES } from '@/security/scopes'

import { getIdentities } from './getIdentities'

export function identitiesRouter(): Router {
  const router = Router()

  router.get('/', requireScopes([SCOPES.READ_MEMBERS]), safeWrap(getIdentities))

  return router
}
