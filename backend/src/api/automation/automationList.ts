import { AutomationState, AutomationTrigger, AutomationType } from '@crowd/types'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import PermissionChecker from '../../services/user/permissionChecker'
import { AutomationCriteria } from '../../types/automationTypes'

/**
 * GET /tenant/{tenantId}/automation
 * @summary List automations
 * @tag Automations
 * @security Bearer
 * @description Get all existing automation data for tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} [filter[type]] - Filter by type of automation
 * @queryParam {string} [filter[trigger]] - Filter by trigger type of automation
 * @queryParam {string} [filter[state]] - Filter by state of automation
 * @queryParam {number} [offset] - Skip the first n results. Default 0.
 * @queryParam {number} [limit] - Limit the number of results. Default 50.
 * @response 200 - Ok
 * @responseContent {AutomationPage} 200.application/json
 * @responseExample {AutomationPage} 200.application/json.AutomationPage
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationRead)

  let offset = 0
  if (req.query.offset) {
    offset = parseInt(req.query.offset, 10)
  }
  let limit = 50
  if (req.query.limit) {
    limit = parseInt(req.query.limit, 10)
  }

  const criteria: AutomationCriteria = {
    type: req.query.filter?.type ? (req.query.filter.type as AutomationType) : undefined,
    trigger: req.query.filter?.trigger
      ? (req.query.filter?.trigger as AutomationTrigger)
      : undefined,
    state: req.query.filter?.state ? (req.query.filter.state as AutomationState) : undefined,
    limit,
    offset,
  }

  const payload = await new AutomationService(req).findAndCountAll(criteria)

  await req.responseHandler.success(req, res, payload)
}
