import { safeWrap } from '@/middlewares/error.middleware'

export default (app) => {
  // Member Affiliation List
  app.get(`/member/:memberId/affiliation`, safeWrap(require('./memberAffiliationList').default))

  // Member Affiliation Create Multiple
  app.patch(
    `/member/:memberId/affiliation`,
    safeWrap(require('./memberAffiliationUpdateMultiple').default),
  )

  app.post(
    `/member/:memberId/affiliation/override`,
    safeWrap(require('./memberAffiliationChangeOverride').default),
  )
}
