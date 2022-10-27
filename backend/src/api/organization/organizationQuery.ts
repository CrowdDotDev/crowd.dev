import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import track from '../../segment/track'

/**
 * POST /tenant/{tenantId}/organization/query
 * @summary Query organizations
 * @tag Organizations
 * @security Bearer
 * @description Query organizations. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {OrganizationQuery} application/json
 * @response 200 - Ok
 * @responseContent {OrganizationList} 200.application/json
 * @responseExample {OrganizationList} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

    const payload = await new OrganizationService(req).query(req.body)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Organizations Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
