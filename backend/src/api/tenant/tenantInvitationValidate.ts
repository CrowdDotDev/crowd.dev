import TenantService from '../../services/tenantService'

export default async (req, res) => {
  try {
    const { invitationToken } = req.params
    const { email } = req.body
    
    const tenantService = new TenantService(req)
    const invitationInfo = await tenantService.processInvitationLink(invitationToken, email)
    
    await req.responseHandler.success(req, res, invitationInfo)
  } catch (error) {
    await req.responseHandler.error(req, res, error)
  }
}