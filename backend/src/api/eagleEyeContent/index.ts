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
  app.put(
    `/tenant/:tenantId/eagleEyeContent/:id`,
    safeWrap(require('./eagleEyeContentUpdate').default),
  )
  app.get(`/tenant/:tenantId/eagleEyeContent`, safeWrap(require('./eagleEyeContentList').default))
  app.get(
    `/tenant/:tenantId/eagleEyeContent/:id`,
    safeWrap(require('./eagleEyeContentFind').default),
  )
}
