import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/data-quality/member`, safeWrap(require('./dataQualityMember').default))
  app.get(
    `/tenant/:tenantId/data-quality/organization`,
    safeWrap(require('./dataQualityOrganization').default),
  )
}
