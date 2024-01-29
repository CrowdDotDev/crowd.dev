import { Error403 } from '@crowd/common'
import TenantService from '../../services/tenantService'
import identifyTenant from '@/segment/identifyTenant'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  // In the case of the Tenant, specific permissions like tenantDestroy and tenantEdit are
  // checked inside the service
  const payload = await new TenantService(req).update(req.params.id, req.body)

  identifyTenant({ ...req, currentTenant: payload })

  await req.responseHandler.success(req, res, payload)
}
