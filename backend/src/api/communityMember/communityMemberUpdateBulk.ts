import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import CommunityMemberService from '../../services/communityMemberService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.communityMemberEdit)

    const membersToUpdate = req.body.data

    const communityMemberService = new CommunityMemberService(req)

    const promises = membersToUpdate.reduce((acc, item) => {
      acc.push(communityMemberService.update(item.id, item))
      return acc
    }, [])

    Promise.all(promises).then(async (payload) => {
      await ApiResponseHandler.success(req, res, payload)
    })
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
