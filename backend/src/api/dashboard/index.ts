import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/dashboard`, safeWrap(require('./dashboardGet').default))
}
