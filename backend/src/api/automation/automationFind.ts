import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import ApiResponseHandler from '../apiResponseHandler'

/**
 * GET /tenant/{tenantId}/automation/{automationId}
 * @summary Get an existing automation data
 * @tag Automations
 * @security Bearer
 * @description Get an existing automation data in the tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Automation ID that you want to update
 * @response 200 - Ok
 * @responseContent {Automation} 200.application/json
 * @responseExample {Automation} 200.application/json.Automation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.automationRead)
    const payload = await new AutomationService(req).findById(req.params.automationId)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
