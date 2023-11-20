import { Error404 } from '@crowd/common'
import Permissions from '../../security/permissions'
import identifyTenant from '../../segment/identifyTenant'
import TenantService from '../../services/tenantService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  req.currentTenant = { id: req.params.id }
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)
  let payload
  if (req.params.id) {
    payload = await new TenantService(req).findById(req.params.id)
  } else {
    payload = await new TenantService(req).findByUrl(req.query.url)
  }

  if (payload) {
    if (req.currentUser) {
      identifyTenant({ ...req, currentTenant: payload })
    }

    await req.responseHandler.success(req, res, payload)
  } else {
    throw new Error404()
  }
}
