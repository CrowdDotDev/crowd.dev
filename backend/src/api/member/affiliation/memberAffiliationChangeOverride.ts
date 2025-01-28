import MemberAffiliationsService from '@/services/member/memberAffiliationsService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberAffiliationsService = new MemberAffiliationsService(req)

  const payload = await memberAffiliationsService.changeAffiliationOverride({
    ...req.body,
    memberId: req.params.memberId,
  })

  await req.responseHandler.success(req, res, payload)
}
