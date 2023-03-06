import Permissions from '../../security/permissions'
import track from '../../segment/track'
import UserCreator from '../../services/user/userCreator'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userCreate)

  const creator = new UserCreator(req)

  const payload = await creator.execute(req.body)

  track('User Invited', { ...req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
