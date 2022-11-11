import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/github`, safeWrap(require('./github').default))
}
