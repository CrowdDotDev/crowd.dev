import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tagAutocomplete)

  const payload = await new TagService(req).findAllAutocomplete(req.query.query, req.query.limit)

  await req.responseHandler.success(req, res, payload)
}
