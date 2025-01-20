import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /settings/members/attributes
 * @summary Attribute settings: delete
 * @tag Members
 * @security Bearer
 * @description Delete a members' attribute setting
 * @queryParam {string} id - Id to destroy
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberAttributesDestroy)

  await new MemberAttributeSettingsService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
