import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /settings/members/attributes
 * @summary Attribute settings: create
 * @tag Members
 * @security Bearer
 * @description Create a members' attribute setting
 * @bodyContent {MemberAttributeSettingsCreateInput} application/json
 * @response 200 - Ok
 * @responseContent {MemberAttributeSettings} 200.application/json
 * @responseExample {MemberAttributeSettings} 200.application/json.MemberAttributeSettings
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberAttributesCreate)

  const payload = await new MemberAttributeSettingsService(req).create(req.body)

  await req.responseHandler.success(req, res, payload)
}
