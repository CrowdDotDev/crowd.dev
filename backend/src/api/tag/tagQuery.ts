import Permissions from '../../security/permissions'
import track from '../../segment/track'
import TagService from '../../services/tagService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tagRead)

  const payload = await new TagService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Tags Advanced Filter', { ...req.body }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
