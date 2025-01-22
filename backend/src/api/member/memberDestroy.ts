import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /member/{id}
 * @summary Delete a member
 * @tag Members
 * @security Bearer
 * @description Delete a member given an ID
 * @pathParam {string} id - The ID of the member
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberDestroy)

  await new MemberService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
