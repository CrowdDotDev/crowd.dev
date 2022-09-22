export default (app) => {
  app.post(`/tenant/:tenantId/activity`, require('./activityCreate').default)
  app.post(`/tenant/:tenantId/activity/query`, require('./activityQuery').default)
  app.put(`/tenant/:tenantId/activity/:id`, require('./activityUpdate').default)
  app.post(`/tenant/:tenantId/activity/import`, require('./activityImport').default)
  app.delete(`/tenant/:tenantId/activity`, require('./activityDestroy').default)
  app.get(`/tenant/:tenantId/activity/autocomplete`, require('./activityAutocomplete').default)
  app.get(`/tenant/:tenantId/activity`, require('./activityList').default)
  app.get(`/tenant/:tenantId/activity/:id`, require('./activityFind').default)
  app.post(
    '/tenant/:tenantId/add-activity',
    // Call the addActivityWithMember file in this dir
    require('./activityAddWithMember').default,
  )
}
