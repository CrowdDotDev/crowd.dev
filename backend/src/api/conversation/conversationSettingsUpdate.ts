import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

  const payload = await new ConversationService(req).updateSettings(req.body)

  await req.responseHandler.success(req, res, payload)
}
