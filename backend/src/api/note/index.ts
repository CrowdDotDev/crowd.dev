export default (app) => {
  app.post(`/tenant/:tenantId/note`, require('./noteCreate').default)
  app.put(`/tenant/:tenantId/note/:id`, require('./noteUpdate').default)
  app.post(`/tenant/:tenantId/note/import`, require('./noteImport').default)
  app.delete(`/tenant/:tenantId/note`, require('./noteDestroy').default)
  app.get(`/tenant/:tenantId/note/autocomplete`, require('./noteAutocomplete').default)
  app.get(`/tenant/:tenantId/note`, require('./noteList').default)
  app.get(`/tenant/:tenantId/note/:id`, require('./noteFind').default)
}
