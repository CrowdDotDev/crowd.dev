import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import CommunityMemberService from '../../services/communityMemberService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.communityMemberRead)
    const { data } = req.body
    const payload = await new CommunityMemberService(req).addToNoMerge(
      req.params.memberId,
      data.memberToNotMerge,
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
