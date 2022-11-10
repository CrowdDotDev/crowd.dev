import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberAutocomplete)

  const payload = await new MemberService(req).findAllAutocomplete(req.query.query, req.query.limit)

  await req.responseHandler.success(req, res, payload)
}
