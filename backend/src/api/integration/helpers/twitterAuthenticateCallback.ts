import PermissionChecker from '../../../services/user/permissionChecker'
import ApiResponseHandler from '../../apiResponseHandler'
import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'

export default async (req, res) => {
  try {
    // Checking we have permision to edit the integration
    new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)
    const { redirectUrl, hashtags } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
    const integrationData = {
      profileId: req.user.twitter.profile.id,
      token: req.user.twitter.accessToken,
      refreshToken: req.user.twitter.refreshToken,
      hashtags,
    }
    await new IntegrationService(req).twitterCallback(integrationData)

    res.redirect(redirectUrl)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
