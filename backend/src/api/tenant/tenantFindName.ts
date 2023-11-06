import identifyTenant from '../../segment/identifyTenant'
import TenantService from '../../services/tenantService'
import Error404 from '../../errors/Error404'

export default async (req, res) => {
  // This endpoint is unauthenticated on purpose, but public reprots.
  let payload
  payload = await new TenantService(req).findById(req.params.id)

  if (payload) {
    if (req.currentUser) {
      identifyTenant({ ...req, currentTenant: payload })
    }

    const payloadOut = {
      name: payload.name,
      id: payload.id,
    }

    await req.responseHandler.success(req, res, payloadOut)
  } else {
    throw new Error404()
  }
}
