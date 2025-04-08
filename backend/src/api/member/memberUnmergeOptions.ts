import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const payload = await new MemberService(req).unmergeOptions(
    req.params.memberId,
    req.query.identityId as string,
  )

  await req.responseHandler.success(req, res, payload, 200)
}
