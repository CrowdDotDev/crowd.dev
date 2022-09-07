import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import ApiResponseHandler from '../apiResponseHandler'
import {
  AutomationCriteria,
  AutomationState,
  AutomationTrigger,
  AutomationType,
} from '../../types/automationTypes'

/**
 * GET /tenant/{tenantId}/automation
 * @summary Get all automation data for tenant
 * @tag Automations
 * @security Bearer
 * @description Get all existing automation data for tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @response 200 - Ok
 * @responseContent {AutomationPage} 200.application/json
 * @responseExample {AutomationPage} 200.application/json.AutomationPage
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.automationRead)

    let offset = 0
    if (req.query.offset) {
      offset = parseInt(req.query.offset, 10)
    }
    let limit = 10
    if (req.query.limit) {
      limit = parseInt(req.query.limit, 10)
    }

    const criteria: AutomationCriteria = {
      type: req.query.type ? (req.query.type as AutomationType) : undefined,
      trigger: req.query.trigger ? (req.query.trigger as AutomationTrigger) : undefined,
      state: req.query.state ? (req.query.state as AutomationState) : undefined,
    }

    const payload = await new AutomationService(req).list(criteria, offset, limit)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
