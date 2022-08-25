import ApiResponseHandler from '../apiResponseHandler'
import CubeJsService from '../../services/cubejs/cubeJsService'

export default async (req, res) => {
  try {
    const payload = await CubeJsService.verifyToken(
      req.language,
      req.body.token,
      req.params.tenantId,
    )
    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
