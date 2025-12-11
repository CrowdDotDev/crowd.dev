import DashboardService from '@/services/dashboardService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new DashboardService(req).getMetrics(req.query)

  await req.responseHandler.success(req, res, payload)
}
