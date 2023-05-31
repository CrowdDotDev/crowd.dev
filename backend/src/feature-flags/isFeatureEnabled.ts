import { Unleash } from 'unleash-client'
import { API_CONFIG } from '../conf'
import { FeatureFlag, Edition } from '../types/common'
import getFeatureFlagTenantContext from './getFeatureFlagTenantContext'
import Plans from '../security/plans'

export const PLAN_LIMITS = {
  [Plans.values.essential]: {
    [FeatureFlag.AUTOMATIONS]: 2,
    [FeatureFlag.CSV_EXPORT]: 2,
    [FeatureFlag.MEMBER_ENRICHMENT]: 5,
  },
  [Plans.values.growth]: {
    [FeatureFlag.AUTOMATIONS]: 10,
    [FeatureFlag.CSV_EXPORT]: 10,
    [FeatureFlag.MEMBER_ENRICHMENT]: 1000,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: 200,
  },
}

export default async (featureFlag: FeatureFlag, req: any): Promise<boolean> => {
  if (API_CONFIG.edition === Edition.COMMUNITY) {
    return true
  }

  const context = await getFeatureFlagTenantContext(
    req.currentTenant,
    req.database,
    req.redis,
    req.log,
  )

  const unleash: Unleash = req.unleash

  const enabled = unleash.isEnabled(featureFlag, context)

  return enabled
}
