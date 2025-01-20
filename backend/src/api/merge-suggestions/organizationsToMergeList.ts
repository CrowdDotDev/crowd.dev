import { Error403 } from '@crowd/common'

import Permissions from '../../security/permissions'
import TenantService from '../../services/tenantService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)
  const payload = await new TenantService(req).findOrganizationsToMerge(req.body)

  await req.responseHandler.success(req, res, payload)
}
