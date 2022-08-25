import UserDestroyer from '../../services/premium/user/userDestroyer'
import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.userDestroy)

    const remover = new UserDestroyer(req)

    await remover.destroyAll(req.query)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
