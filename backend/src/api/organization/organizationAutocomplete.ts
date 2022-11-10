import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationAutocomplete)

  const payload = await new OrganizationService(req).findAllAutocomplete(
    req.query.query,
    req.query.limit,
  )

  await req.responseHandler.success(req, res, payload)
}
