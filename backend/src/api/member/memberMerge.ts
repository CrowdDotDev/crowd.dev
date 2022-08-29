import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberEdit)
    const { data } = req.body
    const payload = await new MemberService(req).merge(
      req.params.memberId,
      data.memberToMerge,
    )

    const status = payload.status || 200

    await ApiResponseHandler.success(req, res, payload, status)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
