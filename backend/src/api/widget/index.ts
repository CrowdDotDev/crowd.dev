import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/widget`, safeWrap(require('./widgetCreate').default))
  app.post(`/tenant/:tenantId/widget/query`, safeWrap(require('./widgetQuery').default))
  app.put(`/tenant/:tenantId/widget/:id`, safeWrap(require('./widgetUpdate').default))
  app.post(`/tenant/:tenantId/widget/import`, safeWrap(require('./widgetImport').default))
  app.delete(`/tenant/:tenantId/widget`, safeWrap(require('./widgetDestroy').default))
  app.get(
    `/tenant/:tenantId/widget/autocomplete`,
    safeWrap(require('./widgetAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/widget`, safeWrap(require('./widgetList').default))
  app.get(`/tenant/:tenantId/widget/:id`, safeWrap(require('./widgetFind').default))
}
