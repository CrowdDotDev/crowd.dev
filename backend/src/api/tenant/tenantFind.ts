import identifyTenant from '../../segment/identifyTenant'
import TenantService from '../../services/tenantService'
import Error404 from '../../errors/Error404'

export default async (req, res) => {
  let payload

  if (req.params.id) {
    payload = await new TenantService(req).findById(req.params.id)
  } else {
    payload = await new TenantService(req).findByUrl(req.query.url)
  }

  if (payload) {
    if (req.currentUser) {
      identifyTenant({ ...req, currentTenant: payload })
    }

    await req.responseHandler.success(req, res, payload)
  } else {
    throw new Error404()
  }
}
