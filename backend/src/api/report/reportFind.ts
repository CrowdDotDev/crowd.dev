import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'

export default async (req, res) => {
  try {
    const payload = await new ReportService(req).findById(req.params.id)

    if (!payload.public) {
      new PermissionChecker(req).validateHas(Permissions.values.reportRead)
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
