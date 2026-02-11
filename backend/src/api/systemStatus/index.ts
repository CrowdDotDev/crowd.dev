import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.get(`/system-status`, safeWrap(require('./systemStatus').default))
}
