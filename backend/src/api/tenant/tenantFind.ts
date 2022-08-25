import ApiResponseHandler from '../apiResponseHandler'
import TenantService from '../../services/tenantService'
import identifyTenant from '../../segment/identifyTenant'

export default async (req, res) => {
  try {
    let payload

    if (req.params.id) {
      payload = await new TenantService(req).findById(req.params.id)
    } else {
      payload = await new TenantService(req).findByUrl(req.query.url)
    }

    identifyTenant(req.currentUser, payload)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
