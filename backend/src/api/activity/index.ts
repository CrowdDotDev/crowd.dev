import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/activity/query`, safeWrap(require('./activityQuery').default))
  app.get(`/activity/type`, safeWrap(require('./activityTypes').default))
  app.get(`/activity/channel`, safeWrap(require('./activityChannels').default))
  app.post('/activity/with-member', safeWrap(require('./activityAddWithMember').default))
}
