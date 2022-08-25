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
      crowdToken: req.query.crowdToken,
    }

    const authenticator = passport.authenticate('slack', {
      scope: [
        'users:read',
        'users:read.email',
        'files:read',
        'channels:join',
        'channels:read',
        'channels:history',
        'reactions:read',
        'team:read',
      ],
      state: Buffer.from(JSON.stringify(state)).toString('base64'),
    })

    authenticator(req, res, next)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
