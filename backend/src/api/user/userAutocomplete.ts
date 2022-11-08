import UserRepository from '../../database/repositories/userRepository'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userAutocomplete)

  const payload = await UserRepository.findAllAutocomplete(req.query.query, req.query.limit, req)

  await req.responseHandler.success(req, res, payload)
}
