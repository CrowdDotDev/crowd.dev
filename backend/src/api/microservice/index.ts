import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/microservice`, safeWrap(require('./microserviceCreate').default))
  app.post(`/tenant/:tenantId/microservice/query`, safeWrap(require('./microserviceQuery').default))
  app.put(`/tenant/:tenantId/microservice/:id`, safeWrap(require('./microserviceUpdate').default))
  app.post(
    `/tenant/:tenantId/microservice/import`,
    safeWrap(require('./microserviceImport').default),
  )
  app.delete(`/tenant/:tenantId/microservice`, safeWrap(require('./microserviceDestroy').default))
  app.get(
    `/tenant/:tenantId/microservice/autocomplete`,
    safeWrap(require('./microserviceAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/microservice`, safeWrap(require('./microserviceList').default))
  app.get(`/tenant/:tenantId/microservice/:id`, safeWrap(require('./microserviceFind').default))
}
