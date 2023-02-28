import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/quickstart-guide`, safeWrap(require('./quickstartGuideList').default))
}
