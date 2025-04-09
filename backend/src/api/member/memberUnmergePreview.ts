import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const payload = await new MemberService(req).unmergePreview(
    req.params.memberId,
    req.body.identity,
    req.body.revertPreviousMerge,
  )

  await req.responseHandler.success(req, res, payload, 200)
}
