import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag } from '@crowd/types'
import Plans from '../security/plans'
import getFeatureFlagTenantContext from './getFeatureFlagTenantContext'

export const PLAN_LIMITS = {
  [Plans.values.essential]: {
    [FeatureFlag.AUTOMATIONS]: 2,
    [FeatureFlag.CSV_EXPORT]: 2,
  },
  [Plans.values.growth]: {
    [FeatureFlag.AUTOMATIONS]: 10,
    [FeatureFlag.CSV_EXPORT]: 10,
    [FeatureFlag.MEMBER_ENRICHMENT]: 1000,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: 200,
  },
  [Plans.values.scale]: {
    [FeatureFlag.AUTOMATIONS]: 20,
    [FeatureFlag.CSV_EXPORT]: 20,
    [FeatureFlag.MEMBER_ENRICHMENT]: Infinity,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: Infinity,
  },
  [Plans.values.enterprise]: {
    [FeatureFlag.AUTOMATIONS]: Infinity,
    [FeatureFlag.CSV_EXPORT]: Infinity,
    [FeatureFlag.MEMBER_ENRICHMENT]: Infinity,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: Infinity,
  },
}

export default async (featureFlag: FeatureFlag, req: any): Promise<boolean> =>
  isFeatureEnabled(
    featureFlag,
    async () => getFeatureFlagTenantContext(req.currentTenant, req.database, req.redis, req.log),
    req.unleash,
  )
