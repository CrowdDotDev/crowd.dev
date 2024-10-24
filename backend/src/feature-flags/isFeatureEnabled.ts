import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag } from '@crowd/types'

import getFeatureFlagTenantContext from './getFeatureFlagTenantContext'

export default async (featureFlag: FeatureFlag, req: any): Promise<boolean> =>
  isFeatureEnabled(
    featureFlag,
    async () => getFeatureFlagTenantContext(req.currentTenant, req.database, req.redis, req.log),
    req.unleash,
  )
