import config from '@/config';

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

  isFlagEnabled() {
    return true;
  }
}

export const FeatureFlag = new FeatureFlagService();
