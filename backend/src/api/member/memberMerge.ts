import { CommonMemberService } from '@crowd/common_services'
import { MemberQueryCache, optionsQx } from '@crowd/data-access-layer'

import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberService = new CommonMemberService(optionsQx(req), req.temporal, req.log)

  const payload = await memberService.merge(req.params.memberId, req.body.memberToMerge, req)

  // Invalidate member query cache after merge
  try {
    const cache = new MemberQueryCache(req.redis)
    await cache.invalidateAll()
    req.log.debug('Invalidated member query cache after merge')
  } catch (error) {
    // Don't fail the merge if cache invalidation fails
    req.log.warn('Failed to invalidate member query cache after merge', { error })
  }

  track(
    'Merge members',
    { memberId: req.params.memberId, memberToMergeId: req.body.memberToMerge },
    { ...req },
  )

  const status = payload.status || 200

  await req.responseHandler.success(req, res, payload, status)
}
