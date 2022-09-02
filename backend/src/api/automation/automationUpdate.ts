import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import track from '../../segment/track'
import ApiResponseHandler from '../apiResponseHandler'

/**
 * PUT /tenant/{tenantId}/automation/{automationId}
 * @summary Update an existing automation
 * @tag Automations
 * @security Bearer
 * @description Updates an existing automation in the tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Automation ID that you want to update
 * @bodyContent {AutomationUpdateInput} application/json
 * @response 200 - Ok
 * @responseContent {Automation} 200.application/json
 * @responseExample {AutomationCreateUpdate} 200.application/json.Automation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.automationUpdate)
    const payload = await new AutomationService(req).update(req.params.automationId, req.body)

    track('Automation Updated', { ...payload }, { ...req })

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
