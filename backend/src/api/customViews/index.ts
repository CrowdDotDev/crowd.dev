import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/customview`, safeWrap(require('./customViewCreate').default))
  app.put(`/tenant/:tenantId/customview/:id`, safeWrap(require('./customViewUpdate').default))
  app.patch(`/tenant/:tenantId/customview`, safeWrap(require('./customViewUpdateBulk').default))
  app.delete(`/tenant/:tenantId/customview`, safeWrap(require('./customViewDestroy').default))
  app.get(`/tenant/:tenantId/customview`, safeWrap(require('./customViewQuery').default))
}
