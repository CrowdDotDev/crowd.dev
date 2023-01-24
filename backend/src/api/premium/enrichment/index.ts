import { safeWrap } from '../../../middlewares/errorMiddleware'

export default (app) => {
  app.put(
    `/tenant/:tenantId/enrichment/member/bulk`,
    safeWrap(require('./memberEnrichBulk').default),
  )
  app.put(`/tenant/:tenantId/enrichment/member/:id/`, safeWrap(require('./memberEnrich').default))
}
