import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/task/query`, safeWrap(require('./taskQuery').default))
  app.post(`/tenant/:tenantId/task`, safeWrap(require('./taskCreate').default))
  app.put(`/tenant/:tenantId/task/:id`, safeWrap(require('./taskUpdate').default))
  app.put(`/tenant/:tenantId/task/:id`, safeWrap(require('./taskUpdate').default))
  app.post(`/tenant/:tenantId/task/import`, safeWrap(require('./taskImport').default))
  app.delete(`/tenant/:tenantId/task`, safeWrap(require('./taskDestroy').default))
  app.get(`/tenant/:tenantId/task/autocomplete`, safeWrap(require('./taskAutocomplete').default))
  app.get(`/tenant/:tenantId/task`, safeWrap(require('./taskList').default))
  app.get(`/tenant/:tenantId/task/:id`, safeWrap(require('./taskFind').default))
  app.post(`/tenant/:tenantId/task/batch`, safeWrap(require('./taskBatchOperations').default))
}
