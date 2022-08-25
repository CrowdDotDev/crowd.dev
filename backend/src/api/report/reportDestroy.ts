import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.reportDestroy)

    await new ReportService(req).destroyAll(req.query.ids)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
