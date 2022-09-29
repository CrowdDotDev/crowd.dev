import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'

/**
 * POST tenant/{tenantId}/settings/members/attributes
 * @summary Create a member attribute's settings
 * @tag Member Attributes
 * @security Bearer
 * @description Create a member attribute's settings.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {MemberAttributeSettingsCreateInput} application/json
 * @response 200 - Ok
 * @responseContent {MemberAttributeSettings} 200.application/json
 * @responseExample {MemberAttributeSettings} 200.application/json.MemberAttributeSettings
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberAttributesCreate)

    const payload = await new MemberAttributeSettingsService(req).create(req.body)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
