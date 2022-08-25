import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import track from '../../segment/track'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.reportEdit)

    const payload = await new ReportService(req).update(req.params.id, req.body.data)

    track(
      'Report Updated',
      { id: payload.id, name: payload.name, public: payload.public },
      { ...req },
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
