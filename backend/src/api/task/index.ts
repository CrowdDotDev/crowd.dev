export default (app) => {
  app.post(`/tenant/:tenantId/task/query`, require('./taskQuery').default)
  app.post(`/tenant/:tenantId/task`, require('./taskCreate').default)
  app.put(`/tenant/:tenantId/task/:id`, require('./taskUpdate').default)
  app.put(`/tenant/:tenantId/task/:id/assignTo/:userId`, require('./taskAssignTo').default)
  app.put(
    `/tenant/:tenantId/task/:id/assignTo/email/:userEmail`,
    require('./taskAssignToByEmail').default,
  )
  app.put(`/tenant/:tenantId/task/:id/status/:status`, require('./taskUpdateStatus').default)
  app.put(`/tenant/:tenantId/task/:id`, require('./taskUpdate').default)
  app.post(`/tenant/:tenantId/task/import`, require('./taskImport').default)
  app.delete(`/tenant/:tenantId/task`, require('./taskDestroy').default)
  app.get(`/tenant/:tenantId/task/autocomplete`, require('./taskAutocomplete').default)
  app.get(`/tenant/:tenantId/task`, require('./taskList').default)
  app.get(`/tenant/:tenantId/task/:id`, require('./taskFind').default)
}
