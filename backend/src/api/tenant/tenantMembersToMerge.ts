import ApiResponseHandler from '../apiResponseHandler'
import Error403 from '../../errors/Error403'
import TenantService from '../../services/tenantService'

export default async (req, res) => {
  try {
    if (!req.currentUser || !req.currentUser.id) {
      throw new Error403(req.language)
    }

    req.currentTenant = await new TenantService(req).findById(req.params.id)

    const payload = await new TenantService(req).findMembersToMerge(req.query)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
