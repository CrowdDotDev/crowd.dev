import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'

/**
 * POST /tenant/{tenantId}/organization
 * @summary Create a organization
 * @tag Organizations
 * @security Bearer
 * @description Create a organization
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {OrganizationInput} application/json
 * @response 200 - Ok
 * @responseContent {Organization} 200.application/json
 * @responseExample {Organization} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.organizationCreate)

    const enrichP = req.body?.shouldEnrich || false
    const payload = await new OrganizationService(req).findOrCreate(req.body, enrichP)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
