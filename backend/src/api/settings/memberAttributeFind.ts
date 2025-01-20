import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /settings/members/attributes/{id}
 * @summary Attributes settings: find
 * @tag Members
 * @security Bearer
 * @description Find a single members' attribute setting by ID
 * @pathParam {string} id - The ID of the member attribute's settings
 * @response 200 - Ok
 * @responseContent {MemberAttributeSettings} 200.application/json
 * @responseExample {MemberAttributeSettings} 200.application/json.MemberAttributeSettings
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberAttributesRead)

  const payload = await new MemberAttributeSettingsService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
