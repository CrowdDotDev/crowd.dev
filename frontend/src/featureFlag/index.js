import { UnleashClient } from 'unleash-proxy-client'
import config from '@/config'
import { store } from '@/store'
import LogRocket from 'logrocket'

export const FEATURE_FLAGS = {
  eagleEye: 'eagle-eye',
  communityCenterPro: 'community-help-center-pro',
  organizations: 'organizations',
  automations: 'automations',
  linkedin: 'linkedin',
  memberEnrichment: 'member-enrichment',
  csvExport: 'csv-export'
}

export class FeatureFlagService {
  constructor() {
    this.flags = FEATURE_FLAGS

    if (!config.isCommunityVersion) {
      const unleashConfig = {
        url: `${config.unleash.url}/api/frontend`,
        clientKey: config.unleash.apiKey,
        appName: 'crowd-web-app',
        environment: 'production'
      }

      this.unleash = new UnleashClient(unleashConfig)
    }
  }

  init(tenant) {
    if (config.isCommunityVersion) {
      return
    }

    this.unleash.start()

    const context = this.getContextFromTenant(tenant)
    if (context) {
      this.updateContext(context)
    }

    this.unleash.on('ready', () => {
      store.dispatch('tenant/doUpdateFeatureFlag', {
        isReady: true
      })
    })

    this.unleash.on('error', (error) => {
      LogRocket.captureException(error)
      store.dispatch('tenant/doUpdateFeatureFlag', {
        hasError: true
      })
    })
  }

  isFlagEnabled(flag) {
    if (config.isCommunityVersion) {
      return true
    }

    return this.unleash.isEnabled(flag)
  }

  updateContext(tenant) {
    if (config.isCommunityVersion) {
      return
    }

    const context = this.getContextFromTenant(tenant)

    this.unleash.updateContext(context)
  }

  getContextFromTenant(tenant) {
    if (!tenant) {
      return null
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      isTrialPlan: tenant.isTrialPlan,
      email: tenant.email,
      automationCount: `${tenant.automationCount}`,
      csvExportCount: `${tenant.csvExportCount}`,
      memberEnrichmentCount: `${tenant.memberEnrichmentCount}`,
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
