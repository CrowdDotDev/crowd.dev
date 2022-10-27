import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import track from '../../segment/track'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberRead)
    const payload = await new MemberService(req).findAndCountAll(req.query)

    if (req.query.filter && Object.keys(req.query.filter).length > 1) {
      // the condition is length > 1 because we always use a filter here because of lookalike members
      track('Members Filtered', { filter: req.query.filter }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
