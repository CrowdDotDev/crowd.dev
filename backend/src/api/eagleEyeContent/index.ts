import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(
    `/tenant/:tenantId/eagleEyeContent`,
    safeWrap(require('./eagleEyeContentSearch').default),
  )
  app.post(
    `/tenant/:tenantId/eagleEyeContent/query`,
    safeWrap(require('./eagleEyeContentQuery').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/:id`,
    safeWrap(require('./eagleEyeContentFind').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent/:contentId/action`,
    safeWrap(require('./eagleEyeActionCreate').default),
  )

  app.delete(
    `/tenant/:tenantId/eagleEyeContent/:contentId/action/:actionId`,
    safeWrap(require('./eagleEyeActionDestroy').default),
  )
}
