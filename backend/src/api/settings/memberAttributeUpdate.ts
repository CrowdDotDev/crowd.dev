import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /settings/members/attributes/{id}
 * @summary Attribute settings: update
 * @tag Members
 * @security Bearer
 * @description Update a members' attribute setting
 * @pathParam {string} id - The ID of the member attribute settings
 * @bodyContent {MemberAttributeSettingsUpdateInput} application/json
 * @response 200 - Ok
 * @responseContent {MemberAttributeSettings} 200.application/json
 * @responseExample {MemberAttributeSettings} 200.application/json.MemberAttributeSettings
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberAttributesEdit)

  const payload = await new MemberAttributeSettingsService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
