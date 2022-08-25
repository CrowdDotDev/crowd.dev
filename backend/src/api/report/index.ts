export default (app) => {
  app.post(`/tenant/:tenantId/report`, require('./reportCreate').default)
  app.put(`/tenant/:tenantId/report/:id`, require('./reportUpdate').default)
  app.post(`/tenant/:tenantId/report/import`, require('./reportImport').default)
  app.delete(`/tenant/:tenantId/report`, require('./reportDestroy').default)
  app.get(`/tenant/:tenantId/report/autocomplete`, require('./reportAutocomplete').default)
  app.get(`/tenant/:tenantId/report`, require('./reportList').default)
  app.get(`/tenant/:tenantId/report/:id`, require('./reportFind').default)
}
