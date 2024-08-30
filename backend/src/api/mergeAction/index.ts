import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/mergeActions`, safeWrap(require('./mergeActionQuery').default))
}
