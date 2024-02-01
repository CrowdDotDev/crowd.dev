import Permissions from '../../security/permissions'
import track from '../../segment/track'
import AutomationService from '../../services/automationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/automation/{automationId}
 * @summary Update an automation
 * @tag Automations
 * @security Bearer
 * @description Updates an existing automation in the tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Automation ID that you want to update
 * @bodyContent {AutomationUpdateInput} application/json
 * @response 200 - Ok
 * @responseContent {Automation} 200.application/json
 * @responseExample {Automation} 200.application/json.Automation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationUpdate)
  const payload = await new AutomationService(req).update(req.params.automationId, req.body.data)

  track(
    'Automation Updated',
    { automationId: req.params.automationId, data: req.body.data },
    { ...req },
  )

  await req.responseHandler.success(req, res, payload)
}
