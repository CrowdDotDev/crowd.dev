import { CommonMemberService } from '@crowd/common_services'
import { optionsQx } from '@crowd/data-access-layer'

import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberService = new CommonMemberService(optionsQx(req), req.temporal, req.log)

  const payload = await memberService.merge(req.params.memberId, req.body.memberToMerge)

  track(
    'Merge members',
    { memberId: req.params.memberId, memberToMergeId: req.body.memberToMerge },
    { ...req },
  )

  const status = payload.status || 200

  await req.responseHandler.success(req, res, payload, status)
}
