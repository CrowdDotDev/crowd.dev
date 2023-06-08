import passport from 'passport'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'
import SegmentRepository from '../../../database/repositories/segmentRepository'

export default async (req, res, next) => {
  // Checking we have permision to edit the project
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const state = {
    tenantId: req.params.tenantId,
    segmentIds: SegmentRepository.getSegmentIds(req),
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
}
