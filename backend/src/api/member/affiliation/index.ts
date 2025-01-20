import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Affiliation List
  app.get(`/member/:memberId/affiliation`, safeWrap(require('./memberAffiliationList').default))

  // Member Affiliation Create Multiple
  app.patch(
    `/member/:memberId/affiliation`,
    safeWrap(require('./memberAffiliationUpdateMultiple').default),
  )
}
