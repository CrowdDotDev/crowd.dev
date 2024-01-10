import { Error403 } from '@crowd/common'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

  if (req.body.customUrl) {
    await req.responseHandler.error(
      req,
      res,
      new Error403(
        req.language,
        'communityHelpCenter.errors.planNotSupportingCustomUrls',
        req.currentTenant.plan,
      ),
    )
    return
  }

  const payload = await new ConversationService(req).updateSettings(req.body)

  await req.responseHandler.success(req, res, payload)
}
