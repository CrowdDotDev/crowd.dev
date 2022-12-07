import { PostHog } from 'posthog-node'
import { API_CONFIG } from '../config'
import { FeatureFlag, Edition } from '../types/common'

export default async (
  featureFlag: FeatureFlag,
  tenantId: string,
  posthog: PostHog,
): Promise<boolean> => {
  if (API_CONFIG.edition === Edition.COMMUNITY) {
    return true
  }

  const featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
    groups: { tenant: tenantId },
  })
  return featureFlagEnabled
}
