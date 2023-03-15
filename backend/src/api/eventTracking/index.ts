import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/event-tracking`, safeWrap(require('./eventTrack').default))
}
