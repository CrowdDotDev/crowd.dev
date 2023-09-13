import config from '@/config';
import { store } from '@/store';

export const FEATURE_FLAGS = {
  eagleEye: 'eagle-eye',
  organizations: 'organizations',
  automations: 'automations',
  linkedin: 'linkedin',
  memberEnrichment: 'member-enrichment',
  csvExport: 'csv-export',
  hubspot: 'hubspot',
};

class FeatureFlagService {
  constructor() {
    this.flags = FEATURE_FLAGS;
  }

  init(tenant) {
    store.dispatch('tenant/doUpdateFeatureFlag', {
      isReady: true,
    });
  }

  isFlagEnabled(flag) {
    return true;
  }

  updateContext(tenant) {
    if (config.isCommunityVersion) {
      return;
    }

    const context = this.getContextFromTenant(tenant);
    if (context) {
      this.unleash.updateContext(context);
    }
  }

  getContextFromTenant(tenant) {
    if (!tenant || !tenant.id) {
      return null;
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      isTrialPlan: tenant.isTrialPlan,
      email: tenant.email,
      automationCount: `${tenant.automationCount}`,
      csvExportCount: `${tenant.csvExportCount}`,
      memberEnrichmentCount: `${tenant.memberEnrichmentCount}`,
      plan: tenant.plan,
    };
  }

  premiumFeatureCopy() {
    if (config.isCommunityVersion) {
      return 'Premium';
    }
    return 'Growth';
  }

  scaleFeatureCopy() {
    if (config.isCommunityVersion) {
      return 'Premium';
    }
    return 'Scale';
  }
}

export const FeatureFlag = new FeatureFlagService();
