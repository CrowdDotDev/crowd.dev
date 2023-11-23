import { FeatureFlag } from '@crowd/types'
import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'

export default (app) => {
  app.post(
    `/tenant/:tenantId/eagleEyeContent/query`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeContentQuery').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeContentUpsert').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent/track`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeContentTrack').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/reply`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeContentReply').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/search`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeContentSearch').default),
  )

  app.get(
    `/tenant/:tenantId/eagleEyeContent/:id`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeContentFind').default),
  )

  app.post(
    `/tenant/:tenantId/eagleEyeContent/:contentId/action`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeActionCreate').default),
  )

  app.put(
    `/tenant/:tenantId/eagleEyeContent/settings`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeSettingsUpdate').default),
  )

  app.delete(
    `/tenant/:tenantId/eagleEyeContent/:contentId/action/:actionId`,
    featureFlagMiddleware(FeatureFlag.EAGLE_EYE, 'entities.eagleEye.errors.planLimitExceeded'),
    safeWrap(require('./eagleEyeActionDestroy').default),
  )
}
