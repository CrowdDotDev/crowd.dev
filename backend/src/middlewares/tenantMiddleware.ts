import { DEFAULT_TENANT_ID } from '@crowd/common'

import TenantService from '../services/tenantService'

export async function tenantMiddleware(req, res, next) {
  try {
    const tenantId = DEFAULT_TENANT_ID
    const tenant = await new TenantService(req).findById(tenantId)
    req.currentTenant = tenant
    next()
  } catch (error) {
    next(error)
  }
}
