import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/note/query`, safeWrap(require('./noteQuery').default))
  app.post(`/tenant/:tenantId/note`, safeWrap(require('./noteCreate').default))
  app.put(`/tenant/:tenantId/note/:id`, safeWrap(require('./noteUpdate').default))
  app.post(`/tenant/:tenantId/note/import`, safeWrap(require('./noteImport').default))
  app.delete(`/tenant/:tenantId/note`, safeWrap(require('./noteDestroy').default))
  app.get(`/tenant/:tenantId/note/autocomplete`, safeWrap(require('./noteAutocomplete').default))
  app.get(`/tenant/:tenantId/note`, safeWrap(require('./noteList').default))
  app.get(`/tenant/:tenantId/note/:id`, safeWrap(require('./noteFind').default))
}
