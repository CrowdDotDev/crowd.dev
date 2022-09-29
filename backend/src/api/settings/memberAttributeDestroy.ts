import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'

/**
 * DELETE /tenant/{tenantId}/settings/members/attributes
 * @summary Attribute settings: delete
 * @tag Members
 * @security Bearer
 * @description Delete a members' attribute setting
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} id - Id to destroy
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberAttributesDestroy)

    await new MemberAttributeSettingsService(req).destroyAll(req.query.ids)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
