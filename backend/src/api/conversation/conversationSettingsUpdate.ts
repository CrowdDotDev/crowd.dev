import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

    const payload = await new ConversationService(req).updateSettings(req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
