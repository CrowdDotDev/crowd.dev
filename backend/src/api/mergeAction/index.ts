import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/mergeActions`, safeWrap(require('./mergeActionQuery').default))
}
