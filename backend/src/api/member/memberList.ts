import Permissions from '../../security/permissions'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)
  const payload = await new MemberService(req).findAndCountAll(req.query)

  if (req.query.filter && Object.keys(req.query.filter).length > 1) {
    // the condition is length > 1 because we always use a filter here because of lookalike members
    track('Members Filtered', { filter: req.query.filter }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
