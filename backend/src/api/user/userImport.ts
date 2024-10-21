import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import UserImporter from '../../services/user/userImporter'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userImport)

  await new UserImporter(req).import(req.body, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
