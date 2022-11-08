import Error403 from '../../errors/Error403'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  req.currentTenant = await new TenantService(req).findById(req.params.id)

  const payload = await new TenantService(req).findMembersToMerge()

  await req.responseHandler.success(req, res, payload)
}
