import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.activityImport)

    await new ActivityService(req).import(req.body.data, req.body.importHash)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
