import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.get(`/user`, safeWrap(require('./userList').default))
  app.get(`/user/autocomplete`, safeWrap(require('./userAutocomplete').default))
  app.get(`/user/:id`, safeWrap(require('./userFind').default))
}
