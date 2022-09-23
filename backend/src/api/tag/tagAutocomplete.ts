import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.tagAutocomplete)

    const payload = await new TagService(req).findAllAutocomplete(req.query.query, req.query.limit)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
