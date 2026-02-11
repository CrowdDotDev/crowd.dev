import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.get(`/dashboard`, safeWrap(require('./dashboardGet').default))
  app.get(`/dashboard/metrics`, safeWrap(require('./dashboardMetricsGet').default))
}
