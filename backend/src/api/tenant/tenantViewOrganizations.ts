import TenantService from '../../services/tenantService'

export default async (req, res) => {
  const payload = await new TenantService(req).viewOrganizations()

  await req.responseHandler.success(req, res, payload)
}
