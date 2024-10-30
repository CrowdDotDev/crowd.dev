import Permissions from '../../security/permissions'
import AutomationExecutionService from '../../services/automationExecutionService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/automation/{automationId}/executions
 * @summary Get automation history
 * @tag Automations
 * @security Bearer
 * @description Get all automation execution history for tenant and automation
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Your workspace/tenant ID
 * @queryParam {integer} [offset=0] - How many elements from the beginning would you like to skip
 * @queryParam {integer} [limit=10] - How many elements would you like to fetch
 * @response 200 - Ok
 * @responseContent {AutomationExecutionPage} 200.application/json
 * @responseExample {AutomationExecutionPage} 200.application/json.AutomationExecutionPage
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationRead)

  let offset = 0
  if (req.query.offset) {
    offset = parseInt(req.query.offset, 10)
  }
  let limit = 10
  if (req.query.limit) {
    limit = parseInt(req.query.limit, 10)
  }

  const payload = await new AutomationExecutionService(req).findAndCountAll({
    automationId: req.params.automationId,
    offset,
    limit,
  })

  await req.responseHandler.success(req, res, payload)
}
