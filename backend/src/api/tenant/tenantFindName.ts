import { Error404 } from '@crowd/common'
import identifyTenant from '../../segment/identifyTenant'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  // This endpoint is unauthenticated on purpose, but public reprots.
  const payload = await new TenantService(req).findById(req.params.id)

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
