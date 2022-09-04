export default (app) => {
  app.put(`/tenant/:tenantId/settings`, require('./settingsSave').default)
  app.get(`/tenant/:tenantId/settings`, require('./settingsFind').default)

  app.post('/tenant/:tenantId/settings/members/attributes', require('./memberAttributeCreate').default)
  app.delete(`/tenant/:tenantId/settings/members/attributes`, require('./memberAttributeDestroy').default)
  app.put(`/tenant/:tenantId/settings/members/attributes/:id`, require('./memberAttributeUpdate').default)
  app.get(`/tenant/:tenantId/settings/members/attributes`, require('./memberAttributeList').default)
  app.get(`/tenant/:tenantId/settings/members/attributes/:id`, require('./memberAttributeFind').default)

}
