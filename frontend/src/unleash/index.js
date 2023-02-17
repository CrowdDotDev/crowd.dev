import { UnleashClient } from 'unleash-proxy-client'
import config from '@/config'

export const FEATURE_FLAGS = {
  eagleEye: 'eagle-eye',
  communityCenterPro: 'community-help-center-pro',
  organizations: 'organizations',
  automations: 'automations',
  linkedin: 'linkedin'
}

export class FeatureFlagService {
  constructor() {
    const unleashConfig = {
      url: `${config.unleash.url}/api/frontend`,
      clientKey: config.unleash.apiKey,
      appName: 'crowd-web-app',
      environment: 'production'
    }

    this.flags = FEATURE_FLAGS
    this.unleash = new UnleashClient(unleashConfig)
  }

  init(tenant) {
    const context = this.getContextFromTenant(tenant)

    this.unleash.start()
    this.updateContext(context)
    this.unleash.on('ready', () => {
      console.log('Unleash is ready')
    })
  }

  isFlagEnabled(flag) {
    return this.unleash.isEnabled(flag)
  }

  updateContext(tenant) {
    const context = this.getContextFromTenant(tenant)

    this.unleash.updateContext(context)
  }

  getContextFromTenant(tenant) {
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      isTrialPlan: tenant.isTrialPlan,
      email: tenant.email,
      automationCount: tenant.automationCount,
      csvExportCount: tenant.csvExportCount,
      memberEnrichmentCount: tenant.memberEnrichmentCount,
      plan: tenant.plan
    }
  }

  premiumFeatureCopy() {
    if (config.isCommunityVersion) {
      return 'Premium'
    } else {
      return 'Growth'
    }
  }
}

export const FeatureFlag = new FeatureFlagService()
