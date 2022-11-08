import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationImport)

  await new IntegrationService(req).import(req.body, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
