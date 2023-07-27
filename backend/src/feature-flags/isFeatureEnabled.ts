import { Unleash } from 'unleash-client'
import { Edition } from '@crowd/types'
import { API_CONFIG } from '../conf'
import { FeatureFlag } from '../types/common'
import getFeatureFlagTenantContext from './getFeatureFlagTenantContext'
import Plans from '../security/plans'

export const PLAN_LIMITS = {
  [Plans.values.essential]: {
    [FeatureFlag.AUTOMATIONS]: 2,
    [FeatureFlag.CSV_EXPORT]: 2,
    [FeatureFlag.MEMBER_ENRICHMENT]: 5,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: 5,
  },
  [Plans.values.growth]: {
    [FeatureFlag.AUTOMATIONS]: 10,
    [FeatureFlag.CSV_EXPORT]: 10,
    [FeatureFlag.MEMBER_ENRICHMENT]: 1000,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: 200,
  },
  [Plans.values.scale]: {
    [FeatureFlag.AUTOMATIONS]: 100,
    [FeatureFlag.CSV_EXPORT]: 100,
    [FeatureFlag.MEMBER_ENRICHMENT]: 10000,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: 2000,
  },
  [Plans.values.enterprise]: {
    [FeatureFlag.AUTOMATIONS]: Infinity,
    [FeatureFlag.CSV_EXPORT]: Infinity,
    [FeatureFlag.MEMBER_ENRICHMENT]: Infinity,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: Infinity,
  },
}

export default async (featureFlag: FeatureFlag, req: any): Promise<boolean> => {
  if (featureFlag === FeatureFlag.SEGMENTS) {
    return API_CONFIG.edition === Edition.LFX
  }

  if ([Edition.COMMUNITY, Edition.LFX].includes(API_CONFIG.edition as Edition)) {
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
