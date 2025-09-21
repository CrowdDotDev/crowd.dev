import { Error400 } from '@crowd/common'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  try {
    const tenantService = new TenantService(req)
    const invitationLink = await tenantService.generateInvitationLink(req.body)
    
    await req.responseHandler.success(req, res, invitationLink)
  } catch (error) {
    await req.responseHandler.error(req, res, error)
  }
}