import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

  const identity = {
    ...req.query.identity,
    verified: req.query?.identity?.verified === 'true',
  }

  const payload = await new OrganizationService(req).canRevertMerge(
    req.params.organizationId,
    identity,
  )

  await req.responseHandler.success(req, res, payload, 200)
}
