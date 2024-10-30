import OrganizationService from '@/services/organizationService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

  const payload = await new OrganizationService(req).unmerge(req.params.organizationId, req.body)

  await req.responseHandler.success(req, res, payload, 200)
}
