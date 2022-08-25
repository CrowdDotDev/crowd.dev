import ApiResponseHandler from '../apiResponseHandler'
import Error403 from '../../errors/Error403'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  try {
    if (!req.currentUser || !req.currentUser.id) {
      throw new Error403(req.language)
    }

    // In the case of the Tenant, specific permissions like tenantDestroy and tenantEdit are
    // checked inside the service
    const payload = await new TenantService(req).update(req.params.id, req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
