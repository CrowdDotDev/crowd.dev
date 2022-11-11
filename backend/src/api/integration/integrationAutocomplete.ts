import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationAutocomplete)

  const payload = await new IntegrationService(req).findAllAutocomplete(
    req.query.query,
    req.query.limit,
  )

  await req.responseHandler.success(req, res, payload)
}
