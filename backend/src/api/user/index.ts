export default (app) => {
  app.post(`/tenant/:tenantId/user`, require('./userCreate').default)
  app.put(`/tenant/:tenantId/user`, require('./userEdit').default)
  app.post(`/tenant/:tenantId/user/import`, require('./userImport').default)
  app.delete(`/tenant/:tenantId/user`, require('./userDestroy').default)
  app.get(`/tenant/:tenantId/user`, require('./userList').default)
  app.get(`/tenant/:tenantId/user/autocomplete`, require('./userAutocomplete').default)
  app.get(`/tenant/:tenantId/user/:id`, require('./userFind').default)
}
