import CubeJsService from '../../services/cubejs/cubeJsService'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)
  const segments = SequelizeRepository.getSegmentIds(req)
  const payload = await CubeJsService.generateJwtToken(req.params.tenantId, segments)
  await req.responseHandler.success(req, res, payload)
}
