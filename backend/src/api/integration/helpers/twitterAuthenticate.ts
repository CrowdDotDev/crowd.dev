// import passport from 'passport'
// import { PlatformType } from '@crowd/types'
// import Permissions from '../../../security/permissions'
// import PermissionChecker from '../../../services/user/permissionChecker'

// export default async (req, res, next) => {
//   // Checking we have permision to edit the project
//   new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

//   const state = {
//     tenantId: req.params.tenantId,
//     redirectUrl: req.query.redirectUrl,
//     hashtags: req.query.hashtags ? req.query.hashtags : '',
//     crowdToken: req.query.crowdToken,
//     platform: PlatformType.TWITTER,
//     userId: req.currentUser.id,
//   }

//   const authenticator = passport.authenticate('twitter', {
//     scope: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'offline.access'],
//     state,
//   })

//   authenticator(req, res, next)
// }
