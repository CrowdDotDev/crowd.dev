import { Router } from 'express'

import { requireScopes } from '@/api/public/middlewares/requireScopes'
import { safeWrap } from '@/middlewares/errorMiddleware'
import { SCOPES } from '@/security/scopes'

import { getMemberIdentities } from './getMemberIdentities'
import { getMemberRoles } from './getMemberRoles'
import { getMemberWorkExperiences } from './getMemberWorkExperiences'
import { searchMembers } from './searchMembers'

export function membersRouter(): Router {
  const router = Router()

  router.post('/search', requireScopes([SCOPES.READ_MEMBERS]), safeWrap(searchMembers))

  router.get(
    '/:memberId/identities',
    requireScopes([SCOPES.READ_MEMBER_IDENTITIES]),
    safeWrap(getMemberIdentities),
  )

  router.get('/:memberId/roles', requireScopes([SCOPES.READ_ROLES]), safeWrap(getMemberRoles))

  router.get(
    '/:memberId/work-experiences',
    requireScopes([SCOPES.READ_WORK_EXPERIENCES]),
    safeWrap(getMemberWorkExperiences),
  )

  return router
}
