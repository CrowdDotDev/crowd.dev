import TenantService from '../services/tenantService'

export async function tenantMiddleware(req, res, next, value) {
  try {
    const tenant = await new TenantService(req).findById(value)
    req.currentTenant = tenant
    next()
  } catch (error) {
    next(error)
  }
}
