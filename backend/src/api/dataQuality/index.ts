import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/data-quality/member`, safeWrap(require('./dataQualityMember').default))
  app.get(`/data-quality/organization`, safeWrap(require('./dataQualityOrganization').default))
}
