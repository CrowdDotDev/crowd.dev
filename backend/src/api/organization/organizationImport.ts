import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationImport)

  await new OrganizationService(req).import(req.body.data, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
