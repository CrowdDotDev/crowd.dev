import { safeWrap } from '../../middlewares/errorMiddleware'
import OrganizationService from '../../services/organizationService'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default safeWrap(async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

  const payload = await new OrganizationService(req).getLocationStats(req.query)

  await req.responseHandler.success(req, res, payload)
})