import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/github`, safeWrap(require('./github').default))
  app.post(`/stripe`, safeWrap(require('./stripe').default))
}
