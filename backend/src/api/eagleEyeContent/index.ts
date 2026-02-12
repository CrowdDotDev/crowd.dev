import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/eagleEyeContent/query`, safeWrap(require('./eagleEyeContentQuery').default))

  app.post(`/eagleEyeContent`, safeWrap(require('./eagleEyeContentUpsert').default))

  app.post(`/eagleEyeContent/track`, safeWrap(require('./eagleEyeContentTrack').default))

  app.get(`/eagleEyeContent/reply`, safeWrap(require('./eagleEyeContentReply').default))

  app.get(`/eagleEyeContent/search`, safeWrap(require('./eagleEyeContentSearch').default))

  app.get(`/eagleEyeContent/:id`, safeWrap(require('./eagleEyeContentFind').default))

  app.post(
    `/eagleEyeContent/:contentId/action`,
    safeWrap(require('./eagleEyeActionCreate').default),
  )

  app.put(`/eagleEyeContent/settings`, safeWrap(require('./eagleEyeSettingsUpdate').default))

  app.delete(
    `/eagleEyeContent/:contentId/action/:actionId`,
    safeWrap(require('./eagleEyeActionDestroy').default),
  )
}
