import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/plan/stripe/webhook`, safeWrap(require('./stripe/webhook').default))
  app.post(`/tenant/:tenantId/plan/stripe/portal`, safeWrap(require('./stripe/portal').default))
  app.post(`/tenant/:tenantId/plan/stripe/checkout`, safeWrap(require('./stripe/checkout').default))
}
