import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

  const payload = await new OrganizationService(req).unmergePreview(
    req.params.organizationId,
    req.body.identity,
    req.body.revertPreviousMerge,
  )

  await req.responseHandler.success(req, res, payload, 200)
}
