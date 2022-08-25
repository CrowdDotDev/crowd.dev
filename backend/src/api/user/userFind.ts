import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import UserRepository from '../../database/repositories/userRepository'
import Permissions from '../../security/permissions'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.userRead)

    const payload = await UserRepository.findById(req.params.id, req)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
