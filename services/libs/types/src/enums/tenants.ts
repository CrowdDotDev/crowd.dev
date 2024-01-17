import { FeatureFlag } from './featureFlags'

export enum TenantPlans {
  Essential = 'Essential',
  Growth = 'Growth',
  EagleEye = 'Eagle Eye',
  Scale = 'Scale',
  Enterprise = 'Enterprise',
}

export const PLAN_LIMITS = {
  [TenantPlans.Essential]: {
    [FeatureFlag.AUTOMATIONS]: 2,
    [FeatureFlag.CSV_EXPORT]: 2,
  },
  [TenantPlans.Growth]: {
    [FeatureFlag.AUTOMATIONS]: 10,
    [FeatureFlag.CSV_EXPORT]: 10,
    [FeatureFlag.MEMBER_ENRICHMENT]: 1000,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: 200,
  },
  [TenantPlans.Scale]: {
    [FeatureFlag.AUTOMATIONS]: 20,
    [FeatureFlag.CSV_EXPORT]: 20,
    [FeatureFlag.MEMBER_ENRICHMENT]: Infinity,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: Infinity,
  },
  [TenantPlans.Enterprise]: {
    [FeatureFlag.AUTOMATIONS]: Infinity,
    [FeatureFlag.CSV_EXPORT]: Infinity,
    [FeatureFlag.MEMBER_ENRICHMENT]: Infinity,
    [FeatureFlag.ORGANIZATION_ENRICHMENT]: Infinity,
  },
}
