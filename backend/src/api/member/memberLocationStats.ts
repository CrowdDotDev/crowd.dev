import { safeWrap } from '../../middlewares/errorMiddleware'
import MemberService from '../../services/memberService'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default safeWrap(async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new MemberService(req).getLocationStats(req.query)

  await req.responseHandler.success(req, res, payload)
})