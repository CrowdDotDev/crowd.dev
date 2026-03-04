import { invalidateMemberQueryCache } from '@crowd/common_services'

import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const { memberId } = req.params
  const { secondary } = req.body

  const payload = await new MemberService(req).unmerge(memberId, req.body)

  try {
    await invalidateMemberQueryCache(req.redis, [memberId, secondary.id])
  } catch (error) {
    req.log.warn({ error }, 'Cache invalidation failed after member unmerge')
  }

  return req.responseHandler.success(req, res, payload)
}
