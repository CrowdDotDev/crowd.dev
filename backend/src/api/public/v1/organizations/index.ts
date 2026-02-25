import { Router } from 'express'

import { safeWrap } from '@/middlewares/errorMiddleware'

import { createOrganization } from './createOrganization'
import { getOrganization } from './getOrganization'
import { SCOPES } from '@/security/scopes'
import { requireScopes } from '../../middlewares/requireScopes'

export function organizationsRouter(): Router {
  const router = Router()

  router.get('/', requireScopes([SCOPES.READ_ORGANIZATIONS]), safeWrap(getOrganization))
  router.post('/', requireScopes([SCOPES.WRITE_ORGANIZATIONS]), safeWrap(createOrganization))

  return router
}
