export default (app) => {
  app.post(`/tenant/:tenantId/organization`, require('./organizationCreate').default)
  app.post(`/tenant/:tenantId/organization/query`, require('./organizationQuery').default)
  app.put(`/tenant/:tenantId/organization/:id`, require('./organizationUpdate').default)
  app.post(`/tenant/:tenantId/organization/import`, require('./organizationImport').default)
  app.delete(`/tenant/:tenantId/organization`, require('./organizationDestroy').default)
  app.get(
    `/tenant/:tenantId/organization/autocomplete`,
    require('./organizationAutocomplete').default,
  )
  app.get(`/tenant/:tenantId/organization`, require('./organizationList').default)
  app.get(`/tenant/:tenantId/organization/:id`, require('./organizationFind').default)
}
