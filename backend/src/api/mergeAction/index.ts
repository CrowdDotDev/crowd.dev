import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.get(`/mergeActions`, safeWrap(require('./mergeActionQuery').default))
}
