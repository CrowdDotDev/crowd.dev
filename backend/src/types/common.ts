export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}

export interface SearchCriteria {
  limit?: number
  offset?: number
}

export enum FeatureFlag {
  AUTOMATIONS = 'automations',
  COMMUNITY_HELP_CENTER_PRO = 'community-help-center-pro',
  EAGLE_EYE = 'eagle-eye',
  ORGANIZATIONS = 'organizations',
  CSV_EXPORT = 'csv-export',
  LINKEDIN = 'linkedin',
  MEMBER_ENRICHMENT = 'member-enrichment',
}

export enum FeatureFlagRedisKey {
  CSV_EXPORT_COUNT = 'csvExportCount',
  MEMBER_ENRICHMENT_COUNT = 'memberEnrichmentCount',
}

export enum Edition {
  COMMUNITY = 'community',
  CROWD_HOSTED = 'crowd-hosted',
}
