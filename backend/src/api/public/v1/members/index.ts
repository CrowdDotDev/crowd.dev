import { Router } from 'express'

import { requireScopes } from '@/api/public/middlewares/requireScopes'
import { safeWrap } from '@/middlewares/errorMiddleware'
import { SCOPES } from '@/security/scopes'

import { getMemberIdentities } from './identities/getMemberIdentities'
import { updateMemberIdentity } from './identities/updateMemberIdentity'
import { getMemberMaintainerRoles } from './maintainer-roles/getMemberMaintainerRoles'
import { resolveMemberByIdentities } from './resolveMember'
import { getMemberWorkExperiences } from './work-experiences/getMemberWorkExperiences'

export function membersRouter(): Router {
  const router = Router()

  router.post('/resolve', requireScopes([SCOPES.READ_MEMBERS]), safeWrap(resolveMemberByIdentities))

  router.get(
    '/:memberId/identities',
    requireScopes([SCOPES.READ_MEMBER_IDENTITIES]),
    safeWrap(getMemberIdentities),
  )

  router.patch(
    '/:memberId/identities/:identityId',
    requireScopes([SCOPES.WRITE_MEMBER_IDENTITIES]),
    safeWrap(updateMemberIdentity),
  )

  router.get(
    '/:memberId/maintainer-roles',
    requireScopes([SCOPES.READ_MAINTAINER_ROLES]),
    safeWrap(getMemberMaintainerRoles),
  )

  router.get(
    '/:memberId/work-experiences',
    requireScopes([SCOPES.READ_WORK_EXPERIENCES]),
    safeWrap(getMemberWorkExperiences),
  )

  return router
}
