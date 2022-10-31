export default (app) => {
  app.post(`/tenant/:tenantId/widget`, require('./widgetCreate').default)
  app.post(`/tenant/:tenantId/widget/query`, require('./widgetQuery').default)
  app.put(`/tenant/:tenantId/widget/:id`, require('./widgetUpdate').default)
  app.post(`/tenant/:tenantId/widget/import`, require('./widgetImport').default)
  app.delete(`/tenant/:tenantId/widget`, require('./widgetDestroy').default)
  app.get(`/tenant/:tenantId/widget/autocomplete`, require('./widgetAutocomplete').default)
  app.get(`/tenant/:tenantId/widget`, require('./widgetList').default)
  app.get(`/tenant/:tenantId/widget/:id`, require('./widgetFind').default)
}
