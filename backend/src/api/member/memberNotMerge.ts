import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberAttributesEdit)
    const payload = await new MemberService(req).addToNoMerge(
      req.params.memberId,
      req.body.memberToNotMerge,
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
