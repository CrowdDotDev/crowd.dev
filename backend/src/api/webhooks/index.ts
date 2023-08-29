import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/github`, safeWrap(require('./github').default))
  app.post(`/stripe`, safeWrap(require('./stripe').default))
  app.post(`/sendgrid`, safeWrap(require('./sendgrid').default))
  app.post(`/discourse/:tenantId`, safeWrap(require('./discourse').default))
  app.post(`/groupsio`, safeWrap(require('./groupsio').default))
}
