import Permissions from '../../security/permissions'
import track from '../../segment/track'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

  const payload = await new OrganizationService(req).findAndCountAll(req.query)

  if (req.query.filter) {
    track('Organizations Filtered', { filter: req.query.filter }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
