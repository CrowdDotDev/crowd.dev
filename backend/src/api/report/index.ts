import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/report`, safeWrap(require('./reportCreate').default))
  app.post(`/tenant/:tenantId/report/query`, safeWrap(require('./reportQuery').default))
  app.put(`/tenant/:tenantId/report/:id`, safeWrap(require('./reportUpdate').default))
  app.post(`/tenant/:tenantId/report/:id/duplicate`, safeWrap(require('./reportDuplicate').default))
  app.post(`/tenant/:tenantId/report/import`, safeWrap(require('./reportImport').default))
  app.delete(`/tenant/:tenantId/report`, safeWrap(require('./reportDestroy').default))
  app.get(
    `/tenant/:tenantId/report/autocomplete`,
    safeWrap(require('./reportAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/report`, safeWrap(require('./reportList').default))
  app.get(`/tenant/:tenantId/report/:id`, safeWrap(require('./reportFind').default))
}
