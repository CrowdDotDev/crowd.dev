import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/activity`, safeWrap(require('./activityCreate').default))
  app.post(`/tenant/:tenantId/activity/query`, safeWrap(require('./activityQuery').default))
  app.put(`/tenant/:tenantId/activity/:id`, safeWrap(require('./activityUpdate').default))
  app.post(`/tenant/:tenantId/activity/import`, safeWrap(require('./activityImport').default))
  app.delete(`/tenant/:tenantId/activity`, safeWrap(require('./activityDestroy').default))
  app.get(
    `/tenant/:tenantId/activity/autocomplete`,
    safeWrap(require('./activityAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/activity`, safeWrap(require('./activityList').default))
  app.get(`/tenant/:tenantId/activity/type`, safeWrap(require('./activityTypes').default))
  app.get(`/tenant/:tenantId/activity/channel`, safeWrap(require('./activityChannels').default))
  // app.get(`/tenant/:tenantId/activity/:id`, safeWrap(require('./activityFind').default))
  app.post(
    '/tenant/:tenantId/activity/with-member',
    // Call the addActivityWithMember file in this dir
    safeWrap(require('./activityAddWithMember').default),
  )
}
