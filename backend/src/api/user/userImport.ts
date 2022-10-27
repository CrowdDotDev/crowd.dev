import UserImporter from '../../services/premium/user/userImporter'
import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.userImport)

    await new UserImporter(req).import(req.body, req.body.importHash)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
