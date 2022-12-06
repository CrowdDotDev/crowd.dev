import isFeatureEnabled from '../../feature-flags/isFeatureEnabled'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

  if (
    req.body.customUrl &&
    !(await isFeatureEnabled('community-help-center-pro', req.currentTenant.id, req.posthog))
  ) {
    await req.responseHandler.success(req, res, {
      message: `Your plan (${req.currentTenant.plan}) doesn't include custom urls.`,
    })
  }

  const payload = await new ConversationService(req).updateSettings(req.body)

  await req.responseHandler.success(req, res, payload)
}
