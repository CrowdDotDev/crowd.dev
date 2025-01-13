import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(
    `/tenant/:tenantId/eagleEyeContent/query`,
    safeWrap(require('./eagleEyeContentQuery').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent`,
    safeWrap(require('./eagleEyeContentUpsert').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent/track`,
    safeWrap(require('./eagleEyeContentTrack').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/reply`,
    safeWrap(require('./eagleEyeContentReply').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/search`,
    safeWrap(require('./eagleEyeContentSearch').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/:id`,
    safeWrap(require('./eagleEyeContentFind').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent/:contentId/action`,
    safeWrap(require('./eagleEyeActionCreate').default),
  )

  app.put(
    `/tenant/:tenantId/eagleEyeContent/settings`,
    safeWrap(require('./eagleEyeSettingsUpdate').default),
  )

  app.delete(
    `/tenant/:tenantId/eagleEyeContent/:contentId/action/:actionId`,
    safeWrap(require('./eagleEyeActionDestroy').default),
  )
}
