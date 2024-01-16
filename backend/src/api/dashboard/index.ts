import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/dashboard`, safeWrap(require('./dashboardGet').default))
}
