import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/automation/{automationId}
 * @summary Find an automation
 * @tag Automations
 * @security Bearer
 * @description Get an existing automation data in the tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Automation ID that you want to find
 * @response 200 - Ok
 * @responseContent {Automation} 200.application/json
 * @responseExample {Automation} 200.application/json.Automation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationRead)
  const payload = await new AutomationService(req).findById(req.params.automationId)

  await req.responseHandler.success(req, res, payload)
}
