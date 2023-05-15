import passport from 'passport'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import { getSlackNotifierStrategy } from '../../services/auth/passportStrategies/slackStrategy'

export default async (req, res, next) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationCreate)
  const state = {
    tenantId: req.params.tenantId,
    redirectUrl: req.query.redirectUrl,
    crowdToken: req.query.crowdToken,
  }

  const authenticator = passport.authenticate(getSlackNotifierStrategy(), {
    scope: ['incoming-webhook'],
    state: Buffer.from(JSON.stringify(state)).toString('base64'),
  })

  authenticator(req, res, next)
}
