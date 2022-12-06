import { PostHog } from 'posthog-node'
import { API_CONFIG } from '../config'

export default async (featureFlag: string, tenantId: string, posthog: PostHog): Promise<boolean> => {
  if (API_CONFIG.edition === 'community') {
    return true
  }

  const featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
    groups: { tenant: tenantId },
  })
  return featureFlagEnabled
}
