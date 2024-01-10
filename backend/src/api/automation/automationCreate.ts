import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import track from '../../segment/track'
import identifyTenant from '../../segment/identifyTenant'

/**
 * POST /tenant/{tenantId}/automation
 * @summary Create an automation
 * @tag Automations
 * @security Bearer
 * @description Create a new automation for the tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {AutomationCreateInput} application/json
 * @response 200 - Ok
 * @responseContent {Automation} 200.application/json
 * @responseExample {Automation} 200.application/json.Automation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationCreate)

  const payload = await new AutomationService(req).create(req.body.data)

  track('Automation Created', { ...req.body.data }, { ...req })

  identifyTenant(req)

  await req.responseHandler.success(req, res, payload)
}
