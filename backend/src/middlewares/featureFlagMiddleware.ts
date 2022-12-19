import Error403 from '../errors/Error403'
import isFeatureEnabled from '../feature-flags/isFeatureEnabled'
import { FeatureFlag } from '../types/common'

export function featureFlagMiddleware(featureFlag: FeatureFlag, errorMessage: string) {
  return async (req, res, next) => {
    await req.posthog.reloadFeatureFlags()

    if (!(await isFeatureEnabled(featureFlag, req.currentTenant.id, req.posthog))) {
      await req.responseHandler.error(req, res, new Error403(req.language, errorMessage))
      return
    }
    next()
  }
}
