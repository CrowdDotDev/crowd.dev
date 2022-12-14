import posthog from 'posthog-js'
import config from '@/config'

export const featureFlags = {
  eagleEye: 'eagle-eye',
  communityCenterPro: 'community-help-center-pro',
  organizations: 'organizations',
  automations: 'automations'
}

export const isFeatureEnabled = async (flag) => {
  if (config.isCommunityVersion) {
    return true
  }

  return posthog.isFeatureEnabled(flag)
}
