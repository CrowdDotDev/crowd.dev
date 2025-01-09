import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/user`, safeWrap(require('./userList').default))
  app.get(`/tenant/:tenantId/user/autocomplete`, safeWrap(require('./userAutocomplete').default))
  app.get(`/tenant/:tenantId/user/:id`, safeWrap(require('./userFind').default))
}
