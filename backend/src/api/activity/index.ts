import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/activity`, safeWrap(require('./activityCreate').default))
  app.post(`/activity/query`, safeWrap(require('./activityQuery').default))
  app.put(`/activity/:id`, safeWrap(require('./activityUpdate').default))
  app.delete(`/activity`, safeWrap(require('./activityDestroy').default))
  app.get(`/activity/type`, safeWrap(require('./activityTypes').default))
  app.get(`/activity/channel`, safeWrap(require('./activityChannels').default))
  app.post('/activity/with-member', safeWrap(require('./activityAddWithMember').default))
}
