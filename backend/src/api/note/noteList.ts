import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.noteRead)

    const payload = await new NoteService(req).findAndCountAll(req.query)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
