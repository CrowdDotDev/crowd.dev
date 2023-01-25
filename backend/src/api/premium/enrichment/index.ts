import { safeWrap } from '../../../middlewares/errorMiddleware'

export default (app) => {
  app.put(
    `/tenant/:tenantId/enrichment/member/bulk`,
    featureFlagMiddleware(FeatureFlag.MEMBER_ENRICHMENT, 'enrichment.errors.planLimitExceeded'),
    safeWrap(require('./memberEnrichBulk').default),
  )
  app.put(
    `/tenant/:tenantId/enrichment/member/:id/`,
    featureFlagMiddleware(FeatureFlag.MEMBER_ENRICHMENT, 'enrichment.errors.planLimitExceeded'),
    safeWrap(require('./memberEnrich').default),
  )
}
