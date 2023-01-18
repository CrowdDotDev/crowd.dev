import { safeWrap } from '../../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../../middlewares/featureFlagMiddleware'
import { FeatureFlag } from '../../../types/common'

export default (app) => {
  app.put(
    `/tenant/:tenantId/enrichment/member/bulk`,
    safeWrap(require('./memberEnrichBulk').default),
  )
  app.put(`/tenant/:tenantId/enrichment/member/:id/`, safeWrap(require('./memberEnrich').default))
}
