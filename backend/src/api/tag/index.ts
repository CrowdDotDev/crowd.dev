export default (app) => {
  app.post(`/tenant/:tenantId/tag`, require('./TagCreate').default)
  app.put(`/tenant/:tenantId/tag/:id`, require('./TagUpdate').default)
  app.post(`/tenant/:tenantId/tag/import`, require('./TagImport').default)
  app.delete(`/tenant/:tenantId/tag`, require('./TagDestroy').default)
  app.get(`/tenant/:tenantId/tag/autocomplete`, require('./TagAutocomplete').default)
  app.get(`/tenant/:tenantId/tag`, require('./TagList').default)
  app.get(`/tenant/:tenantId/tag/:id`, require('./TagFind').default)
}
