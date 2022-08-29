import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

    const membersToUpdate = req.body.data

    const memberService = new MemberService(req)

    const promises = membersToUpdate.reduce((acc, item) => {
      acc.push(memberService.update(item.id, item))
      return acc
    }, [])

    Promise.all(promises).then(async (payload) => {
      await ApiResponseHandler.success(req, res, payload)
    })
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
