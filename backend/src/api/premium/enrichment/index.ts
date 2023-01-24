import { safeWrap } from '../../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../../middlewares/featureFlagMiddleware'
import { FeatureFlag } from '../../../types/common'

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
