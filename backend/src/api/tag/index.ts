export default (app) => {
  app.post(`/tenant/:tenantId/tag`, require('./tagCreate').default)
  app.put(`/tenant/:tenantId/tag/:id`, require('./tagUpdate').default)
  app.post(`/tenant/:tenantId/tag/import`, require('./tagImport').default)
  app.delete(`/tenant/:tenantId/tag`, require('./tagDestroy').default)
  app.get(`/tenant/:tenantId/tag/autocomplete`, require('./tagAutocomplete').default)
  app.get(`/tenant/:tenantId/tag`, require('./tagList').default)
  app.get(`/tenant/:tenantId/tag/:id`, require('./tagFind').default)
}
