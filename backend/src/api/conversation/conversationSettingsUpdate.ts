import Error403 from '../../errors/Error403'
import isFeatureEnabled from '../../feature-flags/isFeatureEnabled'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'
import { FeatureFlag } from '../../types/common'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

  if (req.body.customUrl && !(await isFeatureEnabled(FeatureFlag.COMMUNITY_HELP_CENTER_PRO, req))) {
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
