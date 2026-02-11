import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.get(`/data-quality/member`, safeWrap(require('./dataQualityMember').default))
  app.get(`/data-quality/organization`, safeWrap(require('./dataQualityOrganization').default))
}
