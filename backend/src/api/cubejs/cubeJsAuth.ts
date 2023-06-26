import CubeJsService from '../../services/cubejs/cubeJsService'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'

export default async (req, res) => {
  const segments = SequelizeRepository.getSegmentIds(req)
  const payload = await CubeJsService.generateJwtToken(req.params.tenantId, segments)
  await req.responseHandler.success(req, res, payload)
}
