import Error403 from '../../errors/Error403'
import TenantService from '../../services/tenantService'
import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new TenantService(req).findMembersToMerge(req.query)

  await req.responseHandler.success(req, res, payload)
}
