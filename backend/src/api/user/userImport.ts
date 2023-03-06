import Permissions from '../../security/permissions'
import UserImporter from '../../services/user/userImporter'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userImport)

  await new UserImporter(req).import(req.body, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
