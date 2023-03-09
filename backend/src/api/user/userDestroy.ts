import Permissions from '../../security/permissions'
import UserDestroyer from '../../services/user/userDestroyer'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userDestroy)

  const remover = new UserDestroyer(req)

  await remover.destroyAll(req.query)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
