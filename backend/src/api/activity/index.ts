import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/activity`, safeWrap(require('./activityCreate').default))
  app.post(`/tenant/activity/query`, safeWrap(require('./activityQuery').default))
  app.put(`/tenant/activity/:id`, safeWrap(require('./activityUpdate').default))
  app.delete(`/tenant/activity`, safeWrap(require('./activityDestroy').default))
  app.get(`/tenant/activity/type`, safeWrap(require('./activityTypes').default))
  app.get(`/tenant/activity/channel`, safeWrap(require('./activityChannels').default))
  app.post(
    '/tenant/activity/with-member',
    safeWrap(require('./activityAddWithMember').default),
  )
}
