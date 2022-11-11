import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  // Checking we have permision to edit the integration
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)
  const { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())

  const integrationData = {
    token: req.account.slack.botToken,
    integrationIdentifier: req.account.slack.teamId,
  }
  await new IntegrationService(req).slackCallback(integrationData)

  res.redirect(redirectUrl)
}
