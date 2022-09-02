import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import ApiResponseHandler from '../apiResponseHandler'

/**
 * GET /tenant/{tenantId}/automation/{automationId}/history
 * @summary Get all automation execution history for tenant and automation
 * @tag Automations
 * @security Bearer
 * @description Get all automation execution history for tenant and automation
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Your workspace/tenant ID
 * @queryParam {integer} [page=1] - Which page are you listing
 * @queryParam {integer} [perPage=10] - How many elements would you like to list per page
 * @response 200 - Ok
 * @responseContent {AutomationExecutionPage} 200.application/json
 * @responseExample {AutomationExecutionPage} 200.application/json.AutomationExecutionPage
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.automationRead)

    let page = 1
    if (req.query.page) {
      page = parseInt(req.query.page, 10)
    }
    let perPage = 10
    if (req.query.perPage) {
      perPage = parseInt(req.query.perPage, 10)
    }

    const payload = await new AutomationService(req).listExecutions(
      req.params.automationId,
      page,
      perPage,
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
