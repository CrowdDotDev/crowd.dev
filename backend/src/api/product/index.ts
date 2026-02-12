import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/product/event`, safeWrap(require('./productEventCreate').default))
  app.post(`/product/session`, safeWrap(require('./productSessionCreate').default))
  app.put(`/product/session/:id`, safeWrap(require('./productSessionUpdate').default))
}
