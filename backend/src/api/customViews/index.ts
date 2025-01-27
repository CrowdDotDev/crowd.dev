import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/customview`, safeWrap(require('./customViewCreate').default))
  app.put(`/customview/:id`, safeWrap(require('./customViewUpdate').default))
  app.patch(`/customview`, safeWrap(require('./customViewUpdateBulk').default))
  app.delete(`/customview`, safeWrap(require('./customViewDestroy').default))
  app.get(`/customview`, safeWrap(require('./customViewQuery').default))
}
