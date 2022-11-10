import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteRead)

  const payload = await new NoteService(req).findAndCountAll(req.query)

  await req.responseHandler.success(req, res, payload)
}
