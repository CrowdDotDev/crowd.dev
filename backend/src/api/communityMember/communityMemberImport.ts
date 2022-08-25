import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import CommunityMemberService from '../../services/communityMemberService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.communityMemberImport)

    await new CommunityMemberService(req).import(req.body.data, req.body.importHash)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
