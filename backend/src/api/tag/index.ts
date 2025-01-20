import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tag`, safeWrap(require('./tagCreate').default))
  app.post(`/tag/query`, safeWrap(require('./tagQuery').default))
  app.put(`/tag/:id`, safeWrap(require('./tagUpdate').default))
  app.delete(`/tag`, safeWrap(require('./tagDestroy').default))
  app.get(`/tag/autocomplete`, safeWrap(require('./tagAutocomplete').default))
  app.get(`/tag`, safeWrap(require('./tagList').default))
  app.get(`/tag/:id`, safeWrap(require('./tagFind').default))
}
