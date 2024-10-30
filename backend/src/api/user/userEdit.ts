import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import UserEditor from '../../services/user/userEditor'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.userEdit)

  const editor = new UserEditor(req)

  await editor.update(req.body)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
