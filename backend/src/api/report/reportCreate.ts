import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import track from '../../segment/track'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.reportCreate)

    const payload = await new ReportService(req).create(req.body)

    track(
      'Report Created',
      { id: payload.id, name: payload.name, public: payload.public },
      { ...req },
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
