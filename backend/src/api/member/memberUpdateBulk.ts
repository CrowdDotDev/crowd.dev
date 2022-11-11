import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const membersToUpdate = req.body

  const memberService = new MemberService(req)

  const promises = membersToUpdate.reduce((acc, item) => {
    acc.push(memberService.update(item.id, item))
    return acc
  }, [])

  const payload = await Promise.all(promises)
  await req.responseHandler.success(req, res, payload)
}
