import { getDefaultTenantId } from '@crowd/common'

import TenantService from '../services/tenantService'

export async function tenantMiddleware(req, res, next) {
  try {
    const tenantId = getDefaultTenantId()
    const tenant = await new TenantService(req).findById(tenantId)
    req.currentTenant = tenant
    next()
  } catch (error) {
    next(error)
  }
}
