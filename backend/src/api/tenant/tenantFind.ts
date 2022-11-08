import identifyTenant from '../../segment/identifyTenant'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  let payload

  if (req.params.id) {
    payload = await new TenantService(req).findById(req.params.id)
  } else {
    payload = await new TenantService(req).findByUrl(req.query.url)
  }

  identifyTenant(req.currentUser, payload)

  await req.responseHandler.success(req, res, payload)
}
