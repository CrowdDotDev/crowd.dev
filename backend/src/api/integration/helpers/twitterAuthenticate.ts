import passport from 'passport'
import PermissionChecker from '../../../services/user/permissionChecker'
import ApiResponseHandler from '../../apiResponseHandler'
import Permissions from '../../../security/permissions'

export default async (req, res, next) => {
  try {
    // Checking we have permision to edit the project
    new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

    const state = {
      tenantId: req.params.tenantId,
      redirectUrl: req.query.redirectUrl,
      hashtags: req.query.hashtags,
      crowdToken: req.query.crowdToken,
    }

    const authenticator = passport.authenticate('twitter', {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'offline.access'],
      state,
    })

    authenticator(req, res, next)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
