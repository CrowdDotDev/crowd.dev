import { PostHog } from 'posthog-node'
import { API_CONFIG } from '../config'
import { FeatureFlag } from '../types/featureFlag'

export default async (
  featureFlag: FeatureFlag,
  tenantId: string,
  posthog: PostHog,
): Promise<boolean> => {
  if (API_CONFIG.edition === 'community') {
    return true
  }

  const featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
    groups: { tenant: tenantId },
  })
  return featureFlagEnabled
}
