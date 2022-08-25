import PermissionChecker from '../../../services/user/permissionChecker'
import ApiResponseHandler from '../../apiResponseHandler'
import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'

export default async (req, res) => {
  try {
    // Checking we have permision to edit the integration
    new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)
    const { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())

    const integrationData = {
      token: req.account.slack.botToken,
      integrationIdentifier: req.account.slack.teamId,
    }
    await new IntegrationService(req).slackCallback(integrationData)

    res.redirect(redirectUrl)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
