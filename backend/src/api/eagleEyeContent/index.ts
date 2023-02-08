import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'
import { FeatureFlag } from '../../types/common'

export default (app) => {
  app.post(
    `/tenant/:tenantId/eagleEyeContent/query`,
    safeWrap(require('./eagleEyeContentQuery').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent`,
    safeWrap(require('./eagleEyeContentUpsert').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/search`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
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
