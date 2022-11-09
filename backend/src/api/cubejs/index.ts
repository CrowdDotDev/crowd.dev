import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/cubejs/auth`, safeWrap(require('./cubeJsAuth').default))
  app.post(`/tenant/:tenantId/cubejs/verify`, safeWrap(require('./cubeJsVerifyToken').default))
}
