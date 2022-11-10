import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/tag`, safeWrap(require('./tagCreate').default))
  app.post(`/tenant/:tenantId/tag/query`, safeWrap(require('./tagQuery').default))
  app.put(`/tenant/:tenantId/tag/:id`, safeWrap(require('./tagUpdate').default))
  app.post(`/tenant/:tenantId/tag/import`, safeWrap(require('./tagImport').default))
  app.delete(`/tenant/:tenantId/tag`, safeWrap(require('./tagDestroy').default))
  app.get(`/tenant/:tenantId/tag/autocomplete`, safeWrap(require('./tagAutocomplete').default))
  app.get(`/tenant/:tenantId/tag`, safeWrap(require('./tagList').default))
  app.get(`/tenant/:tenantId/tag/:id`, safeWrap(require('./tagFind').default))
}
