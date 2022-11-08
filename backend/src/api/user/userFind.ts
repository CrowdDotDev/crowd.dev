import UserRepository from '../../database/repositories/userRepository'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userRead)

  const payload = await UserRepository.findById(req.params.id, req)

  await req.responseHandler.success(req, res, payload)
}
