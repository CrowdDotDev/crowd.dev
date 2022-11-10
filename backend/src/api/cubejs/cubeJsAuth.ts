import CubeJsService from '../../services/cubejs/cubeJsService'

export default async (req, res) => {
  const payload = await CubeJsService.generateJwtToken(req.params.tenantId)
  await req.responseHandler.success(req, res, payload)
}
