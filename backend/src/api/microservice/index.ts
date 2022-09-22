export default (app) => {
  app.post(`/tenant/:tenantId/microservice`, require('./microserviceCreate').default)
  app.post(`/tenant/:tenantId/microservice/query`, require('./microserviceQuery').default)
  app.put(`/tenant/:tenantId/microservice/:id`, require('./microserviceUpdate').default)
  app.post(`/tenant/:tenantId/microservice/import`, require('./microserviceImport').default)
  app.delete(`/tenant/:tenantId/microservice`, require('./microserviceDestroy').default)
  app.get(
    `/tenant/:tenantId/microservice/autocomplete`,
    require('./microserviceAutocomplete').default,
  )
  app.get(`/tenant/:tenantId/microservice`, require('./microserviceList').default)
  app.get(`/tenant/:tenantId/microservice/:id`, require('./microserviceFind').default)
}
