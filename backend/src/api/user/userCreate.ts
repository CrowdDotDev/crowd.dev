import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'
import UserCreator from '../../services/user/userCreator'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userCreate)

  const creator = new UserCreator(req)

  const payload = await creator.execute(req.body)

  track('User Invited', { ...req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
