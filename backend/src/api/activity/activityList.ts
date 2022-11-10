import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import track from '../../segment/track'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityRead)

  const payload = await new ActivityService(req).findAndCountAll(req.query)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    track('Activities Filtered', { filter: req.query.filter }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
