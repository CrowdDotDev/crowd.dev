export default (app) => {
  app.put(`/tenant/:tenantId/settings`, require('./settingsSave').default)
  app.get(`/tenant/:tenantId/settings`, require('./settingsFind').default)
}
