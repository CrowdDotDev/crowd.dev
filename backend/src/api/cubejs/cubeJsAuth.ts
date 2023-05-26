import CubeJsService from '../../services/cubejs/cubeJsService'

export default async (req, res) => {
  const segments = req.currentSegments.map((s) => s.id)
  const payload = await CubeJsService.generateJwtToken(req.params.tenantId, segments)
  await req.responseHandler.success(req, res, payload)
}
