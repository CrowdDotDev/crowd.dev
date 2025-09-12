import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new MemberService(req).findMembersWithMergeSuggestions(req.body)

  await req.responseHandler.success(req, res, payload)
}
