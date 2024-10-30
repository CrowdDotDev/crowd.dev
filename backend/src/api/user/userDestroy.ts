import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import UserDestroyer from '../../services/user/userDestroyer'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userDestroy)

  const remover = new UserDestroyer(req)

  await remover.destroyAll(req.query)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
