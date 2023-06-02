import CubeJsService from '../../services/cubejs/cubeJsService'
import SegmentRepository from '../../database/repositories/segmentRepository'

export default async (req, res) => {
  const segments = SegmentRepository.getSegmentIds(req)
  const payload = await CubeJsService.generateJwtToken(req.params.tenantId, segments)
  await req.responseHandler.success(req, res, payload)
}
