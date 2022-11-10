import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/user`, safeWrap(require('./userCreate').default))
  app.put(`/tenant/:tenantId/user`, safeWrap(require('./userEdit').default))
  app.post(`/tenant/:tenantId/user/import`, safeWrap(require('./userImport').default))
  app.delete(`/tenant/:tenantId/user`, safeWrap(require('./userDestroy').default))
  app.get(`/tenant/:tenantId/user`, safeWrap(require('./userList').default))
  app.get(`/tenant/:tenantId/user/autocomplete`, safeWrap(require('./userAutocomplete').default))
  app.get(`/tenant/:tenantId/user/:id`, safeWrap(require('./userFind').default))
}
