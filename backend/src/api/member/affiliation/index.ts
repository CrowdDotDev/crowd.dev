import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Affiliation List
  app.get(
    `/tenant/:tenantId/member/:memberId/affiliation`,
    safeWrap(require('./memberAffiliationList').default),
  )

  // Member Affiliation Create Multiple
  app.patch(
    `/tenant/:tenantId/member/:memberId/affiliation`,
    safeWrap(require('./memberAffiliationUpdateMultiple').default),
  )

  app.post(
    `/tenant/:tenantId/member/:memberId/affiliation/override`,
    safeWrap(require('./memberAffiliationChangeOverride').default),
  )
}
