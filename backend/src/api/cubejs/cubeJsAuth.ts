import ApiResponseHandler from '../apiResponseHandler'
import CubeJsService from '../../services/cubejs/cubeJsService'

export default async (req, res) => {
  try {
    const payload = await CubeJsService.generateJwtToken(req.params.tenantId)
    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
